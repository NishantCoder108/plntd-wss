import { Request, Response } from "express";
import { saveTransaction } from "../services/transactionService";

export const saveTransactionHandler = async (req: Request, res: Response) => {
  try {
    const { txnHash, type } = req.body;
    await saveTransaction(txnHash, type);
    res.json({ message: "Transaction saved successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error saving transaction" });
  }
};
