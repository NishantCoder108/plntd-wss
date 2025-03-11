import prisma from "../prisma";

interface SaveTransactionParams {
  signature: string;
  adminWalletAddress: string;
  amount: bigint;
  fromUserAccount: string;
  toUserAccount: string;
  txnDescription?: string | null;
  feePayer?: string | null;
  txnTimestamp: number;
  fee?: bigint | null;
  txnType: string;
}
export const saveTransaction = async ({
  signature,

  adminWalletAddress,
  amount,
  fromUserAccount,
  toUserAccount,
  txnDescription,
  feePayer,
  txnTimestamp,
  fee,
  txnType,
}: SaveTransactionParams) => {
  try {
    const transaction = await prisma.dBTransaction.create({
      data: {
        signature,
        adminWalletAddress,
        amount,
        fromUserAccount,
        toUserAccount,
        txnDescription,
        feePayer,
        txnTimestamp,
        fee,
        txnType,
      },
    });

    return transaction;
  } catch (error) {
    console.error("Error saving transaction:", error);
    throw new Error("Failed to save transaction");
  }
};
