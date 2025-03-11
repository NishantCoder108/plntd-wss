import { Request, Response } from "express";
import { processWebhook } from "../services/webhookService";
import { socketService } from "../utils/socket";

export const webhookHandler = async (req: Request, res: Response) => {
  console.log("Req body", req.body);

  try {
    const result = await processWebhook(req.body, req.headers.authorization);

    res.json(result);
  } catch (error) {
    console.log("Error Processing webhook ", error);

    const io = socketService.getInstance();
    io.emit("assetManagementError", {
      message: "An unexpected issue has occurred. Please try again later.",
    });

    res.status(500).json({ message: "Internal Server Error" });
  }
};
