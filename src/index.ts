import "dotenv/config";
import http from "http";
import app from "./app";

import { socketService } from "./utils/socket";
import { PORT } from "./config/env";
import prisma from "./prisma";

const server = http.createServer(app);

try {
  socketService.initialize(server);
  console.log("Socket.io initialized");
} catch (error) {
  console.log("Failed to initialize socket.io", error);
  process.exit(1);
}

server.listen(PORT, async () => {
  console.log("Server is running on port:", PORT);
  try {
    await prisma.$connect();
    console.log("Connected to the database");
  } catch (error) {
    console.log("Failed to connect to the database", error);
    process.exit(1);
  }
});
