import { Request, Response } from "express";
import { processWebhook } from "../services/webhookService";

export const webhookHandler = async (req: Request, res: Response) => {
  console.log("Request body :", req.body);

  try {
    const result = await processWebhook(req.body, req.headers.authorization);
    res.json(result);
  } catch (error) {
    console.log("Error Processing webhook ", error);

    res.json({ message: "Internal Server Error at webhookController" });
  }
};
