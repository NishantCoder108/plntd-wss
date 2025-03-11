import {
  burn,
  createTransferInstruction,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_2022_PROGRAM_ID,
  transfer,
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

  console.log("Minted Token : ", mintedToken);
  console.log(
    `Minted ${amount * LAMPORTS_PER_SOL}  token to ${fromUserAccount}`
  );
};

export const burnToken = async (
  fromUserAccount: string,
  amount: number,
  conn: Connection,
  mintATAAddress: string
) => {
  console.log("Burning Token...");
  const associatedToken = await getOrCreateAssociatedTokenAccount(
    conn,
    Keypair.fromSecretKey(bs58.decode(privateKey)),
    new PublicKey(MINT_TOKEN_ADDRESS),
    new PublicKey(fromUserAccount)
  );

  console.log("Finalizing burning...");
  const burnToken = await burn(
    conn, //rpc url
    Keypair.fromSecretKey(bs58.decode(privateKey)), //signer
    associatedToken.address, //burn token from user's ata
    new PublicKey(MINT_TOKEN_ADDRESS),
    Keypair.fromSecretKey(bs58.decode(process.env.UserKey || "")), //user keypair to burn the token
    amount * LAMPORTS_PER_SOL
  );

  console.log({ burnToken });
  // await saveTransaction(burnToken, "burn");
};

export const sendNativeToken = async (
  fromUserAccount: string,
  amount: number,
  conn: Connection,
  mintATAAddress: PublicKey
) => {
  const keypair = Keypair.fromSecretKey(bs58.decode(privateKey));

  // const transaction = new Transaction().add(
  //     SystemProgram.transfer({
  //         fromPubkey: mintATAAddress,
  //         toPubkey: new PublicKey(fromUserAccount),
  //         lamports: amount * LAMPORTS_PER_SOL,
  //     })
  // );
  const userATA = await getOrCreateAssociatedTokenAccount(
    conn,
    Keypair.fromSecretKey(bs58.decode(privateKey)),
    new PublicKey(MINT_TOKEN_ADDRESS),
    new PublicKey(fromUserAccount)
  );

  const transaction = new Transaction().add(
    createTransferInstruction(
      mintATAAddress, //source ATA
      userATA.address, //destination ATA
      keypair.publicKey, //payer
      amount * LAMPORTS_PER_SOL
    )
  );
  // const { blockhash } = await conn.getLatestBlockhash();

  // transaction.recentBlockhash = blockhash;
  // transaction.feePayer = keypair.publicKey;

  // transaction.sign(keypair);

  console.log({ transaction });

  try {
    const signature = await sendAndConfirmTransaction(conn, transaction, [
      keypair,
    ]);
    console.log({ signature });
  } catch (error) {
    console.log({ error });
  }

  // const messageV0 = new TransactionMessage({
  //     payerKey: WALLET.publicKey,
  //     recentBlockhash: blockhash,
  //     instructions: [burnIx]
  //   }).compileToV0Message();
  //   const transac = new VersionedTransaction(messageV0);

  // const signature = await conn.sendTransaction(transac);
  // console.log({ signature });

  //     const serializedTransaction = req.body.message;

  //     console.log("before serialise")
  //     console.log(serializedTransaction);

  //     const tx = Transaction.from(Buffer.from(serializedTransaction))
  //     console.log("after serialise")

  //     console.log(bs58)
  //     const keyPair = Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY as string));

  //     const {blockhash} = await conn.getLatestBlockhash();
  //     tx.blockhash = blockhash
  //     tx.feePayer = keyPair.publicKey

  //     tx.sign(keyPair)

  //     const signature = await connection.sendTransaction(tx, [keyPair])
  //     console.log(signature)
};

/**
 * Two types of token happen :
 * 1. tokenTransfers : when someone send "hSol" token to mint's associated token
 * 2. nativeTransfers : when someone send "sol" token to staked token
 */
