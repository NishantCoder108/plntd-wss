import express from "express";
// import transactionRoutes from "./routes/transactionRoutes";
import webhookRoutes from "./routes/webhookRoutes";
import { authMiddleware } from "./config/middleware";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/webhook", authMiddleware, webhookRoutes);
// app.use("/transaction", transactionRoutes);

app.get("/test", (req, res) => {
  res.send("Hello World!");
});
export default app;
