import { Server as SocketIOServer } from "socket.io";
import { Server as HttpServer } from "http";

export const initializeSocket = (httpServer: HttpServer) => {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Handle test events from client
    socket.on("test", (message) => {
      console.log("Received from client:", message);
      // Echo back to client
      socket.emit("test", `Server received: ${message}`);
    });

    // Handle trade events
    socket.on("newTrade", (tradeData) => {
      // Add timestamp
      const trade = {
        ...tradeData,
        timestamp: Date.now(),
      };
      // Broadcast to all clients
      io.emit("trade", trade);
    });

    // Handle chart data requests
    socket.on("getChartData", ({ timeframe }) => {
      // Mock chart data for now
      const mockData = generateMockChartData(timeframe);
      socket.emit("chartData", mockData);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
};

// Helper function to generate mock chart data
function generateMockChartData(timeframe: string) {
  const now = Date.now();
  const prices: number[] = [];
  const timestamps: number[] = [];

  // Generate 100 data points
  for (let i = 0; i < 100; i++) {
    prices.push(Math.random() * 100 + 50); // Random price between 50-150
    timestamps.push(now - (99 - i) * 60000); // One minute intervals
  }

  return {
    prices,
    timestamps,
  };
}
