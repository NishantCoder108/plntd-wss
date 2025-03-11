import { Router } from "express";

import { saveTransactionHandler } from "../controllers/transactionRoutes";

const router = Router();

router.post("/save", saveTransactionHandler);

export default router;
