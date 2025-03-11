import { Router } from "express";

import { webhookHandler } from "../controllers/webhookController";

console.log("Webhook Routes");
const router = Router();

router.post("/", webhookHandler);

export default router;
