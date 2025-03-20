import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";

let io: SocketIOServer | null = null;

export const socketService = {
  initialize: (server: HTTPServer) => {
    if (!io) {
      io = new SocketIOServer(server, {
        // cors: { origin: "*" },
        cors: {
          origin: process.env.FRONTEND_URL,
          methods: ["GET", "POST"],
        },
      });

      console.log("✅ Socket.IO initialized");

      io.on("connection", (socket: Socket) => {
        console.log(`⚡ New client connected: ${socket.id}`);

        socket.on("disconnect", () => {
          console.log(`❌ Client disconnected: ${socket.id}`);
        });
      });
    }
  },

  getSocketInstance: (): SocketIOServer => {
    if (!io) {
      throw new Error("Socket.IO is not initialized!");
    }
    return io;
  },
};
