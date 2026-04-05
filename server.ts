import express from "express";
import cors from "cors";
import path from "path";
import { Server } from "socket.io";
import http from "http";
import dotenv from "dotenv";
import { db } from "./backend/config/firebase";

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = 3000;

let isReady = false;

// 1. LISTEN IMMEDIATELY - This is the most important part to stop the loading screen
server.listen(PORT, "0.0.0.0", () => {
  console.log("==========================================");
  console.log(`🚀 EthioBankers Server listening on port ${PORT}`);
  console.log("==========================================");
});

// 2. Initial middleware
app.use(cors({
  origin: true, // Allow all origins to prevent CORS issues
  credentials: true,
}));
app.use(express.json());

// 3. Simple ping route for health checks
app.get("/ping", (req, res) => res.send("pong"));

// 4. Temporary loading middleware for web requests during startup
app.use((req, res, next) => {
  if (isReady || req.path.startsWith("/api") || req.path === "/ping") {
    return next();
  }
  res.send(`
    <html>
      <head>
        <title>Starting EthioBankers...</title>
        <style>
          body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f4f4f9; color: #333; }
          .loader { border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 2s linear infinite; margin-bottom: 20px; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
        <script>setTimeout(() => location.reload(), 3000)</script>
      </head>
      <body>
        <div class="loader"></div>
        <h1>EthioBankers is starting up...</h1>
        <p>Please wait while we prepare your experience. This page will refresh automatically.</p>
      </body>
    </html>
  `);
});

// 5. Initialize everything else asynchronously
async function initializeApp() {
  try {
    // Dynamic imports to prevent top-level crashes
    const { createServer: createViteServer } = await import("vite");
    const authRoutes = (await import("./backend/routes/authRoutes")).default;
    const jobRoutes = (await import("./backend/routes/jobRoutes")).default;
    const userRoutes = (await import("./backend/routes/userRoutes")).default;
    const messageRoutes = (await import("./backend/routes/messageRoutes")).default;
    const referralRoutes = (await import("./backend/routes/referralRoutes")).default;
    const paymentRoutes = (await import("./backend/routes/paymentRoutes")).default;
    const applicationRoutes = (await import("./backend/routes/applicationRoutes")).default;
    const adminRoutes = (await import("./backend/routes/adminRoutes")).default;
    const { initTelegramBot, handleTelegramWebhook } = await import("./backend/services/telegramBot");

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

    // API Routes
    app.get("/api/health", (req, res) => {
      res.json({ status: isReady ? "ok" : "initializing", message: "EthioBankers Network API" });
    });

    app.get("/api/test-db", async (req, res) => {
      try {
        const { collection, getDocs, limit, query } = await import("firebase/firestore");
        const q = query(collection(db, "users"), limit(1));
        await getDocs(q);
        res.json({ status: "ok", message: "Firestore connection successful" });
      } catch (err: any) {
        console.error("Firestore test failed:", err);
        res.status(500).json({ status: "error", message: err.message, code: err.code });
      }
    });

    app.use("/api/auth", authRoutes);
    app.use("/api/jobs", jobRoutes);
    app.use("/api/user", userRoutes);
    app.use("/api/messages", messageRoutes);
    app.use("/api/referrals", referralRoutes);
    app.use("/api/payments", paymentRoutes);
    app.use("/api/applications", applicationRoutes);
    app.use("/api/admin", adminRoutes);

    // Telegram Webhook Route
    app.post("/api/telegram-webhook", (req, res) => {
      try {
        handleTelegramWebhook(req.body);
        res.sendStatus(200);
      } catch (err) {
        console.error("Error handling Telegram webhook:", err);
        res.sendStatus(500);
      }
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
    if (process.env.NODE_ENV !== "production") {
      try {
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
    } else {
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }

    // Mark as ready
    isReady = true;
    console.log("🚀 EthioBankers is fully ready!");
  } catch (err) {
    console.error(`Failed during initialization: ${err}`);
  }
}

initializeApp();
