import express from "express";
import { createServer } from "http";
import { initializeSocket } from "./socket";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Initialize socket.io
const io = initializeSocket(httpServer);

const PORT = process.env.PORT || 4000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
