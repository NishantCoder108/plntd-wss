// import { Request, Response } from "express";
// import { saveTransaction } from "../services/saveTransaction";

// export const saveTransactionHandler = async (req: Request, res: Response) => {
//   try {
//     const { signature, type } = req.body;
//     await saveTransaction({
//       signature,
//       adminWalletAddress: "",
//       amount: 0n,
//       fromUserAccount: "",
//       toUserAccount: "",
//       txnDescription: null,
//       feePayer: null,
//       txnTimestamp: 0,
//       fee: null,
//       txnType: type,
//     });
//     res.json({ message: "Transaction saved successfully" });
//   } catch (error) {
//     res.status(500).json({ message: "Error saving transaction" });
//   }
// };
