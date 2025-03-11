import express from "express";
import transactionRoutes from "./routes/transactionRoutes";
import webhookRoutes from "./routes/webhookRoutes";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/webhook", webhookRoutes);
app.use("/transaction", transactionRoutes);

export default app;
