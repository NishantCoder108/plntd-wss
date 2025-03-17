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

    const mintATAAddress = await getAssociatedTokenAddress(
      new PublicKey(MINT_TOKEN_ADDRESS),
      new PublicKey(stakingPoolWallet),
      false,
      TOKEN_2022_PROGRAM_ID
    );
    console.log("mintATAAddress", mintATAAddress.toBase58());

    if (AUTH_WEBHOOK_HEADERS === authorization && type === "TRANSFER") {
      const findSignature = await prisma.dBTransaction.findUnique({
        where: {
          signature,
        },
      });

      console.log({ findSignature });
      if (findSignature) {
        console.log("Already processed");
        return { message: "Already processed" };
      }
      if (
        type === "TRANSFER" &&
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
          return { message: "Not native token transaction" };
        }

        const { amount, fromUserAccount, toUserAccount } = nativeTransfers?.[0];
        io.emit("mintingStart", { message: "Minting in Progress..." });

        console.log("Minting token from webhook services page...");
        // await mintToken(fromUserAccount, amount, conn);
        await transferPLANTDToken(
          fromUserAccount,
          amount,
          conn,
          mintATAAddress
        );

        console.log("Saving transaction from webhook services page... done");
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

        console.log("Minting completed successfully");
        io.emit("mintingComplete", {
          message:
            "Minting completed successfully. Your assets are now secure.",
        });
        return {
          message: "Minting completed successfully",
        };
      }

      // Handle token transfers

      if (type === "UNKNOWN" && transactionError === null && feePayer) {
        const senderATA = await getAssociatedTokenAddress(
          new PublicKey(MINT_TOKEN_ADDRESS),
          new PublicKey(feePayer),
          false,
          TOKEN_2022_PROGRAM_ID
        );
        console.log("senderATA", senderATA.toBase58());

        const tokenTransferTxsAccount = accountData?.find(
          (accountItems: any) => {
            return accountItems.tokenBalanceChanges?.some((token: any) => {
              return (
                token.mint === MINT_TOKEN_ADDRESS &&
                token.tokenAccount === senderATA.toBase58() &&
                token.userAccount === feePayer &&
                token.rawTokenAmount.tokenAmount
              );
            });
          }
        );

        console.log("tokenTransferTxsAccount", tokenTransferTxsAccount);

        if (!tokenTransferTxsAccount) {
          return { message: "No token transfer found..." };
        }

        const tokenAmount = tokenTransferTxsAccount.tokenBalanceChanges?.find(
          (token: any) => {
            return (
              token.mint === MINT_TOKEN_ADDRESS &&
              token.tokenAccount === senderATA.toBase58() &&
              token.userAccount === feePayer
            );
          }
        )?.rawTokenAmount.tokenAmount;

        // const incomingStakeTxns = tokenTransfers.find(
        //   (item) => item.toTokenAccount === mintATAAddress.toBa  se58()
        // );
        // transactionError;
        // if (!incomingStakeTxns) {
        //   return { message: "Processing..." };
        // }

        // console.log("incomingStakeTxns...");
        // const {
        //   fromTokenAccount,
        //   fromUserAccount,
        //   mint,
        //   toTokenAccount,
        //   toUserAccount,
        //   tokenAmount,
        //   tokenStandard,
        // } = tokenTransfers?.[0];

        console.log("tokenAmount", Math.abs(tokenAmount));
        const actualPlntdTokenAmt = Math.abs(tokenAmount) / 1000000; //comming token: 1 plntd token , then i will burn 0.5
        console.log("actualPlntdTokenAmt", actualPlntdTokenAmt);

        if (feePayer === VAULT)
          return { message: "Can't feePayer and vault be same" };
        await burnToken(
          feePayer,
          Math.abs(tokenAmount),
          conn,
          senderATA,
          mintATAAddress
        );

        const solTokenAmount = actualPlntdTokenAmt * 0.5; //10^6 = 1 PLNTD
        console.log("solTokenAmount", solTokenAmount);
        console.log("Burn token done...");
        await sendNativeToken(
          feePayer,
          senderATA,
          solTokenAmount,
          conn,
          mintATAAddress
        );

        await saveTransaction({
          signature: signature,
          adminWalletAddress: feePayer,
          amount: BigInt(Math.abs(tokenAmount)),
          fromUserAccount: senderATA.toBase58(),
          toUserAccount: mintATAAddress.toBase58(),
          txnDescription: description || null,
          feePayer: feePayer,
          txnTimestamp: timestamp,
          fee: fee || null,
          txnType: "BURN",
        });

        return {
          message: "Transaction processed successfully",
        };
      }
    } else {
      return {
        message: "Error: This is not burning or minting operation",
      };
    }
  } catch (error) {
    console.log("Error processing webhook", error);
    return { message: "Internal Server Error at webhookService" };
  }
};
