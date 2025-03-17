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
  VAULT,
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
  conn: Connection,
  fromUserAccount: string,
  amount: number,
  fromTokenAccount: string,
  toTokenAccount: string,
  mint: string
) => {
  console.log("Finalizing burning...");

  const burnToken = await burn(
    conn,
    Keypair.fromSecretKey(bs58.decode(privateKey)),
    new PublicKey(toTokenAccount),
    new PublicKey(MINT_TOKEN_ADDRESS),
    Keypair.fromSecretKey(bs58.decode(privateKey)),
    amount * 10 ** 6,
    [],
    {
      skipPreflight: true,
      commitment: "confirmed",
    },
    TOKEN_2022_PROGRAM_ID
  );

  console.log({ burnToken });

  console.log(
    `Successfully burned ${amount} tokens from the associated token account at ${toTokenAccount}`
  );
};

export const sendNativeToken = async (
  fromUserAccount: string,
  senderATA: PublicKey,
  amount: number,
  conn: Connection
) => {
  const keypair = Keypair.fromSecretKey(bs58.decode(privateKey));

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: new PublicKey(VAULT),
      toPubkey: new PublicKey(fromUserAccount),
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

    console.log(
      `Transferred ${amount}SOL token to ${fromUserAccount} with signature :${signature}`
    );
  } catch (error) {
    console.log(
      `Failed to transfer ${amount}SOL token to ${fromUserAccount} with error :${error}`
    );
  }
};
