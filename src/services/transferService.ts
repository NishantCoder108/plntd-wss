import {
  burn,
  createTransferInstruction,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_2022_PROGRAM_ID,
  transfer,
  transferChecked,
} from "@solana/spl-token";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  VersionedTransaction,
  Transaction,
} from "@solana/web3.js";

import bs58 from "bs58";
import {
  MINT_TOKEN_ADDRESS,
  PLNTD_PRIVATE_KEY,
  PLNTD_SOL_ADDRESS,
  privateKey,
  stakingPoolWallet,
} from "../config/env";

export const mintToken = async (
  fromUserAccount: string,
  amount: number,
  conn: Connection
) => {
  console.log("Minting Token...");

  const associatedToken = await getOrCreateAssociatedTokenAccount(
    conn,
    Keypair.fromSecretKey(bs58.decode(privateKey)), //payer ( private key is string here)
    new PublicKey(MINT_TOKEN_ADDRESS), //mint address
    new PublicKey(fromUserAccount), //comming address , which would be minted token
    false,
    "confirmed",
    {
      skipPreflight: true,
      commitment: "confirmed",
    },
    TOKEN_2022_PROGRAM_ID
  );

  console.log("associatedToken", associatedToken.address.toBase58());

  const tokenAmount = 2 * (amount / LAMPORTS_PER_SOL) * 10 ** 6;
  console.log("tokenAmount", tokenAmount);
  const mintedToken = await mintTo(
    conn,
    Keypair.fromSecretKey(bs58.decode(privateKey)),
    new PublicKey(MINT_TOKEN_ADDRESS),
    associatedToken.address,
    Keypair.fromSecretKey(bs58.decode(privateKey)),
    tokenAmount,
    [Keypair.fromSecretKey(bs58.decode(privateKey))],
    {
      skipPreflight: true,
      commitment: "confirmed",
    },
    TOKEN_2022_PROGRAM_ID
  );

  console.log("Minted Token signature: ", mintedToken);
  console.log(
    `Minted ${amount * LAMPORTS_PER_SOL}  token to ${fromUserAccount}`
  );
};

export const transferPLANTDToken = async (
  fromUserAccount: string,
  amount: number,
  conn: Connection,
  mintATAAddress: PublicKey
) => {
  console.log("Transferring Token...");

  const toTokenAccountAdd = await getOrCreateAssociatedTokenAccount(
    conn,
    Keypair.fromSecretKey(bs58.decode(privateKey)), //payer ( private key is string here)
    new PublicKey(MINT_TOKEN_ADDRESS), //mint address
    new PublicKey(fromUserAccount), //comming address , which would be minted token
    false,
    "confirmed",
    {
      skipPreflight: true,
      commitment: "confirmed",
    },
    TOKEN_2022_PROGRAM_ID
  );

  console.log("toTokenAccountAdd", toTokenAccountAdd.address.toBase58());

  const tokenAmount = 2 * (amount / LAMPORTS_PER_SOL) * 10 ** 6;
  console.log("tokenAmount", tokenAmount);

  const txSignature = await transferChecked(
    conn,
    Keypair.fromSecretKey(bs58.decode(privateKey)),
    mintATAAddress,
    new PublicKey(MINT_TOKEN_ADDRESS),
    new PublicKey(toTokenAccountAdd.address),
    Keypair.fromSecretKey(bs58.decode(privateKey)),
    tokenAmount,
    6,
    [],
    {
      skipPreflight: true,
      commitment: "confirmed",
    },
    TOKEN_2022_PROGRAM_ID
  );

  console.log(
    `Transferred ${
      tokenAmount / 10 ** 6
    } PLANTD token to ${fromUserAccount}'s associated token account ${toTokenAccountAdd.address.toBase58()} with signature ${txSignature}`
  );
};

export const burnToken = async (
  fromUserAccount: string,
  amount: number,
  conn: Connection,
  senderATA: PublicKey,
  mintATAAddress: PublicKey
) => {
  console.log("Burning Token...");

  // const associatedToken = await getOrCreateAssociatedTokenAccount(
  //   conn,
  //   Keypair.fromSecretKey(bs58.decode(privateKey)), //payer ( private key is string here)
  //   new PublicKey(MINT_TOKEN_ADDRESS), //mint address
  //   new PublicKey(fromUserAccount), //comming address , which would be burn token
  //   false,
  //   "confirmed",
  //   {
  //     skipPreflight: true,
  //     commitment: "confirmed",
  //   },
  //   TOKEN_2022_PROGRAM_ID
  // );

  console.log("Finalizing burning...");

  const burnToken = await burn(
    conn, //rpc url
    Keypair.fromSecretKey(bs58.decode(privateKey)), //signer
    new PublicKey(mintATAAddress), //burn token from user's ata
    new PublicKey(MINT_TOKEN_ADDRESS),
    Keypair.fromSecretKey(bs58.decode(privateKey)), //user keypair to burn the token
    amount,
    [Keypair.fromSecretKey(bs58.decode(privateKey))],
    {
      skipPreflight: true,
      commitment: "confirmed",
    },
    TOKEN_2022_PROGRAM_ID
  );

  console.log({ burnToken });
  // await saveTransaction(burnToken, "burn");

  console.log(`Burned ${amount} token from ${mintATAAddress}`);
};

export const sendNativeToken = async (
  feePayer: string,
  senderATA: PublicKey,
  amount: number,
  conn: Connection,
  mintATAAddress: PublicKey
) => {
  const keypair = Keypair.fromSecretKey(bs58.decode(PLNTD_PRIVATE_KEY));

  // const transaction = new Transaction().add(
  //     SystemProgram.transfer({
  //         fromPubkey: mintATAAddress,
  //         toPubkey: new PublicKey(fromUserAccount),
  //         lamports: amount * LAMPORTS_PER_SOL,
  //     })
  // );
  // const userATA = await getOrCreateAssociatedTokenAccount(
  //   conn,
  //   Keypair.fromSecretKey(bs58.decode(privateKey)),
  //   new PublicKey(MINT_TOKEN_ADDRESS),
  //   new PublicKey(fromUserAccount)
  // );

  // const transaction = new Transaction().add(
  //   createTransferInstruction(
  //     mintATAAddress, //source ATA
  //     senderATA, //destination ATA
  //     keypair.publicKey, //payer
  //     amount * LAMPORTS_PER_SOL
  //   )
  // );

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: new PublicKey(PLNTD_SOL_ADDRESS),
      toPubkey: new PublicKey(feePayer),
      lamports: Number(amount) * LAMPORTS_PER_SOL,
    })
  );
  const { blockhash } = await conn.getLatestBlockhash();

  transaction.recentBlockhash = blockhash;
  transaction.feePayer = keypair.publicKey;

  try {
    const signature = await sendAndConfirmTransaction(
      conn,
      transaction,
      [keypair],
      {
        commitment: "confirmed",
        skipPreflight: true,
      }
    );
    console.log("Transaction sent successfully", { signature });

    console.log(`Transferred ${amount}SOL token to ${feePayer}`);
  } catch (error) {
    console.log("Transaction failed at sendNativeToken", { error });
    console.log(`Failed to transfer ${amount}SOL token to ${feePayer}`);
  }
};
