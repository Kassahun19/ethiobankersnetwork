import http from "http";
import { Server } from "socket.io";
import app from "./backend/app";
import { initTelegramBot } from "./backend/services/telegramBot";

const server = http.createServer(app);
const PORT = 3000;

// Socket.io logic
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`A user connected: ${socket.id}`);
  socket.on("join_room", (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });
  socket.on("send_message", (data) => {
    io.to(data.roomId).emit("receive_message", data);
  });
  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

// Initialize Telegram Bot
setTimeout(() => {
  try {
    initTelegramBot();
  } catch (err) {
    console.error(`Failed to initialize Telegram Bot: ${err}`);
  }
}, 1000);

// Vite middleware for development
async function startDevServer() {
  if (process.env.NODE_ENV !== "production") {
    try {
      const { createServer: createViteServer } = await import("vite");
      console.log("Initializing Vite dev server...");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
      console.log("Vite dev server middleware integrated.");
    } catch (err) {
      console.error(`Failed to initialize Vite dev server: ${err}`);
    }
  }
}

startDevServer();

server.listen(PORT, "0.0.0.0", () => {
  console.log("==========================================");
  console.log(`🚀 EthioBankers Server listening on port ${PORT}`);
  console.log("==========================================");
});
