// import express from "express";
// import { createServer } from "http";
// import { initializeSocket } from "./socket";
// import dotenv from "dotenv";

// dotenv.config();

// const app = express();
// const httpServer = createServer(app);

// // Initialize socket.io
// const io = initializeSocket(httpServer);

// const PORT = process.env.PORT || 4000;

// httpServer.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

import "dotenv/config";
import http from "http";
import app from "./app";
// import { connectDB } from "./config/db";

import { socketService } from "./utils/socket";
import { PORT } from "./config/env";

const server = http.createServer(app);

try {
  socketService.initialize(server);
  console.log("Socket.io initialized");
} catch (error) {
  console.log("Failed to initialize socket.io", error);
  process.exit(1);
}

server.listen(PORT, async () => {
  try {
    // await connectDB();
    console.log("Server is running on port :", PORT);
  } catch (error) {
    console.log("Failed to connect to DB", error);
    process.exit(1);
  }
});
