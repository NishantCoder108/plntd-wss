import {
  getAssociatedTokenAddress,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import {
  AUTH_WEBHOOK_HEADERS,
  MINT_TOKEN_ADDRESS,
  RPC_URL,
  stakingPoolWallet,
  VAULT,
} from "../config/env";
import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
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
import { formatString } from "../utils/util";

export const processWebhook = async (
  data: any,
  authorization: string | undefined
) => {
  const io = socketService.getSocketInstance();
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
          io.emit("TOKEN_TRANSFER_FAILED", {
            status: "FAILED",
            message: `Token purchase failed for ${formatString(
              feePayer,
              5,
              5
            )}. Try again.`,
          });

          return {
            message:
              "There is no native token associated with this transaction.",
          };
        }

        const { amount, fromUserAccount, toUserAccount } = incomingTxns;

        console.log(
          "Initiating the minting/transfer process for the token from the webhook service."
        );

        const transferAmount = 2 * (amount / LAMPORTS_PER_SOL);
        io.emit("TRANSFER_PLANTD_TOKEN", {
          status: "PENDING",
          message: `Transferring ${transferAmount} PLANTD to ${formatString(
            fromUserAccount,
            5,
            5
          )}`,
        });
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

        io.emit("TOKEN_TRANSFER_SUCCESS", {
          status: "SUCCESS",
          message: `Token purchase successful for ${formatString(
            fromUserAccount,
            5,
            5
          )}!`,
        });

        console.log(
          "Transaction has been successfully saved from the webhook service."
        );
        return {
          message: "Minting/Transferring completed successfully",
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
          io.emit("TOKEN_TRANSFER_FAILED", {
            status: "FAILED",
            message: `Token sale failed for ${formatString(feePayer, 5, 5)}`,
          });
          return {
            message: "No PLANTD token found in this transaction.",
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

        io.emit("TOKEN_BURN_STARTED", {
          status: "PENDING",
          message: `Selling ${tokenAmount} PLANTD...`,
        });
        await burnToken(
          conn,
          fromUserAccount,
          tokenAmount,
          fromTokenAccount,
          toTokenAccount,
          mint
        );

        const solTokenAmount = tokenAmount * 0.5; //10^6 = 1 PLANTD

        io.emit("TRANSFER_NATIVE_TOKEN", {
          status: "PENDING",
          message: `Transferring ${solTokenAmount} SOL to ${formatString(
            fromUserAccount,
            5,
            5
          )}`,
        });
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

        io.emit("TOKEN_TRANSFER_SUCCESS", {
          status: "SUCCESS",
          message: "PLANTD token sold successfully!",
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
    io.emit("TOKEN_TRANSFER_FAILED", {
      status: "FAILED",
      message: `Transaction failed. Please try again.`,
    });

    console.log("Error processing at wehook service page :", error);
    return { message: "Internal Server Error at webhookService" };
  }
};
