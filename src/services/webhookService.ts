import {
  getAssociatedTokenAddress,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import {
  AUTH_WEBHOOK_HEADERS,
  MINT_TOKEN_ADDRESS,
  PLNTD_SOL_ADDRESS,
  RPC_URL,
  stakingPoolWallet,
  VAULT,
} from "../config/env";
import { Connection, PublicKey } from "@solana/web3.js";
import { socketService } from "../utils/socket";
import { saveTransaction } from "./saveTransaction";
import {
  burnToken,
  mintToken,
  sendNativeToken,
  transferPLANTDToken,
} from "./transferService";
import prisma from "../prisma";
import { parseTransaction } from "../utils/transactions";

export const processWebhook = async (
  data: any,
  authorization: string | undefined
) => {
  try {
    const {
      type,
      nativeTransfers,
      feePayer,
      description,
      tokenTransfers,
      timestamp,
      fee,
      signature,
      accountData,
      transactionError,
    } = data[0];

    const io = socketService.getInstance();
    const conn = new Connection(RPC_URL);

    console.log({
      authorization,
      type,
      nativeTransfers,
      feePayer,
      description,
      tokenTransfers,
      signature,
      accountData,
      transactionError,
    });

    if (AUTH_WEBHOOK_HEADERS === authorization && type === "TRANSFER") {
      const findSignature = await prisma.dBTransaction.findUnique({
        where: {
          signature,
        },
      });

      console.log({ findSignature });
      if (findSignature) {
        console.log("This transaction has already been processed.");
        return { message: "This transaction has already been processed." };
      }

      const parsedTransaction = parseTransaction(description);

      if (!parsedTransaction) {
        console.log("Invalid transaction");
        return { message: "Invalid transaction" };
      }

      const { sender, amount, token, recipient } = parsedTransaction;

      const mintATAAddress = await getAssociatedTokenAddress(
        new PublicKey(MINT_TOKEN_ADDRESS),
        new PublicKey(stakingPoolWallet),
        false,
        TOKEN_2022_PROGRAM_ID
      );
      console.log("mintATAAddress", mintATAAddress.toBase58());
      if (
        token === "SOL" &&
        Array.isArray(nativeTransfers) &&
        nativeTransfers.length > 0
      ) {
        const incomingTxns = nativeTransfers.find(
          (item: {
            amount: number;
            toUserAccount: string;
            fromUserAccount: string;
          }) => item.toUserAccount === VAULT && item.amount > 0
        );
        console.log({ incomingTxns });

        if (!incomingTxns) {
          return {
            message: "This transaction does not involve a native token.",
          };
        }

        const { amount, fromUserAccount, toUserAccount } = incomingTxns;

        io.emit("mintingStart", { message: "Minting in Progress..." });

        console.log(
          "Initiating the minting/transfer process for the token from the webhook service."
        );

        // await mintToken(fromUserAccount, amount, conn);
        await transferPLANTDToken(
          fromUserAccount,
          amount,
          conn,
          mintATAAddress
        );

        console.log("Transfer token completed...");
        await saveTransaction({
          signature: signature,
          adminWalletAddress: fromUserAccount,
          amount: amount,
          fromUserAccount: fromUserAccount,
          toUserAccount: toUserAccount,
          txnDescription: description || null,
          feePayer: feePayer || null,
          txnTimestamp: timestamp,
          fee: fee || null,
          txnType: "MINT",
        });
        console.log(
          "Transaction has been successfully saved from the webhook service."
        );

        io.emit("mintingComplete", {
          message:
            "Minting completed successfully. Your assets are now secure.",
        });
        console.log("Minting completed successfully");
        return {
          message: "Minting completed successfully",
        };
      }

      // Handle PLANTD token transfers

      if (
        token === MINT_TOKEN_ADDRESS &&
        Array.isArray(tokenTransfers) &&
        tokenTransfers.length > 0
      ) {
        const incomingTxns = tokenTransfers.find(
          (item: {
            fromTokenAccount: string;
            fromUserAccount: string;
            mint: string;
            toTokenAccount: string;
            toUserAccount: string;
            tokenAmount: number;
            tokenStandard: string;
          }) =>
            item.toUserAccount === VAULT &&
            item.mint === MINT_TOKEN_ADDRESS &&
            item.tokenAmount > 0
        );
        console.log({ incomingTxns });

        if (!incomingTxns) {
          return {
            message: "This transaction does not involve a PLANTD token.",
          };
        }

        const {
          fromUserAccount,
          fromTokenAccount,
          tokenAmount,
          mint,
          toTokenAccount,
          toUserAccount,
          tokenStandard,
        } = incomingTxns;

        console.log("Burning Token...");

        await burnToken(
          conn,
          fromUserAccount,
          tokenAmount,
          fromTokenAccount,
          toTokenAccount,
          mint
        );

        const solTokenAmount = tokenAmount * 0.5; //10^6 = 1 PLANTD

        console.log("Sending Native Token...");
        await sendNativeToken(
          fromUserAccount,
          fromTokenAccount,
          solTokenAmount,
          conn
        );

        console.log("Saving Transaction...");
        await saveTransaction({
          signature: signature,
          adminWalletAddress: fromUserAccount,
          amount: BigInt(tokenAmount * 10 ** 6),
          fromUserAccount: fromUserAccount,
          toUserAccount: toUserAccount,
          txnDescription: description || null,
          feePayer: feePayer,
          txnTimestamp: timestamp,
          fee: fee || null,
          txnType: "BURN",
        });

        console.log("Transaction has been successfully saved.");
        return {
          message: "The transaction has been successfully processed.",
        };
      }
    } else {
      return {
        message: "Error: This is not burning or minting operation",
      };
    }
  } catch (error) {
    console.log("Error processing at wehook service page :", error);
    return { message: "Internal Server Error at webhookService" };
  }
};
