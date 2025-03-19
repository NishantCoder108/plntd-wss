import express from "express";
import webhookRoutes from "./routes/webhookRoutes";
import { authMiddleware, removeConsole } from "./config/middleware";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/webhook", removeConsole, authMiddleware, webhookRoutes);

app.get("/test", (req, res) => {
  res.send("Hello World!");
});
export default app;
