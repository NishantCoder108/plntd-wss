import { Server as SocketIOServer } from "socket.io";

import { Server as HTTPServer } from "http";

class SocketService {
  private io: SocketIOServer | null = null;

  initialize(server: HTTPServer) {
    if (this.io) {
      throw new Error("Socket.io is already initialized");
    }

    this.io = new SocketIOServer(server);

    this.io.on("connection", (socket) => {
      console.log("Client Connected:", socket.id);

      socket.on("disconnect", () => {
        console.log("Client Disconnected", socket.id);
      });
    });

    return this.io;
  }

  getInstance() {
    if (!this.io) {
      throw new Error("Socket.io is not initialized");
    }

    return this.io;
  }
}

export const socketService = new SocketService();
