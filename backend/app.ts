import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import { db } from "./config/firebase";

// Import routes
import authRoutes from "./routes/authRoutes";
import jobRoutes from "./routes/jobRoutes";
import userRoutes from "./routes/userRoutes";
import messageRoutes from "./routes/messageRoutes";
import referralRoutes from "./routes/referralRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import applicationRoutes from "./routes/applicationRoutes";
import adminRoutes from "./routes/adminRoutes";
import { handleTelegramWebhook } from "./services/telegramBot";

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());

// API Routes
const apiRouter = express.Router();

apiRouter.get("/health", (req, res) => {
  res.json({ status: "ok", message: "EthioBankers Network API" });
});

apiRouter.get("/test-db", async (req, res) => {
  try {
    await db.collection("users").limit(1).get();
    res.json({ status: "ok", message: "Firestore connection successful" });
  } catch (err: any) {
    console.error("Firestore test failed:", err);
    res.status(500).json({ status: "error", message: err.message, code: err.code });
  }
});

apiRouter.get("/test-write", async (req, res) => {
  try {
    const docRef = await db.collection("test").add({
      timestamp: new Date().toISOString(),
      message: "Test write from backend",
      env: process.env.NODE_ENV
    });
    res.json({ status: "ok", message: "Firestore write successful", id: docRef.id });
  } catch (err: any) {
    console.error("Firestore write failed:", err);
    res.status(500).json({ status: "error", message: err.message, code: err.code });
  }
});

apiRouter.get("/config-check", (req, res) => {
  const configKeys = {
    apiKey: !!process.env.FIREBASE_API_KEY,
    authDomain: !!process.env.FIREBASE_AUTH_DOMAIN,
    projectId: !!process.env.FIREBASE_PROJECT_ID,
    storageBucket: !!process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: !!process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: !!process.env.FIREBASE_APP_ID,
    firestoreDatabaseId: !!process.env.FIREBASE_FIRESTORE_DATABASE_ID,
    jwtSecret: !!process.env.JWT_SECRET,
    telegramToken: !!process.env.TELEGRAM_BOT_TOKEN,
    appUrl: process.env.APP_URL,
    nodeEnv: process.env.NODE_ENV,
    isVercel: !!process.env.VERCEL,
  };
  res.json({ status: "ok", configKeys });
});

apiRouter.get("/bot-status", (req, res) => {
  const isProduction = process.env.NODE_ENV === "production" || !!process.env.VERCEL;
  const appUrl = process.env.APP_URL || "https://ethiobankers.vercel.app";
  const webhookUrl = `${appUrl}/api/telegram-webhook`;
  
  res.json({
    status: "ok",
    botInitialized: !!process.env.TELEGRAM_BOT_TOKEN,
    mode: isProduction ? "WEBHOOK" : "POLLING",
    appUrl,
    webhookUrl,
    tokenPresent: !!process.env.TELEGRAM_BOT_TOKEN,
  });
});

apiRouter.get("/bot-setup", async (req, res) => {
  try {
    const { initTelegramBot } = await import("./services/telegramBot");
    const bot = initTelegramBot();
    if (!bot) {
      return res.status(500).json({ status: "error", message: "Failed to initialize bot" });
    }

    const appUrl = process.env.APP_URL || "https://ethiobankers.vercel.app";
    const webhookUrl = `${appUrl}/api/telegram-webhook`;
    
    console.log(`[BOT-SETUP] Manually setting webhook to: ${webhookUrl}`);
    await bot.setWebHook(webhookUrl);
    
    res.json({ status: "ok", message: "Telegram Webhook set successfully", webhookUrl });
  } catch (err: any) {
    console.error("[BOT-SETUP] Error:", err);
    res.status(500).json({ status: "error", message: err.message });
  }
});

apiRouter.use("/auth", authRoutes);
apiRouter.use("/jobs", jobRoutes);
apiRouter.use("/user", userRoutes);
apiRouter.use("/messages", messageRoutes);
apiRouter.use("/referrals", referralRoutes);
apiRouter.use("/payments", paymentRoutes);
apiRouter.use("/applications", applicationRoutes);
apiRouter.use("/admin", adminRoutes);

// Telegram Webhook Route
apiRouter.post("/telegram-webhook", async (req, res) => {
  try {
    await handleTelegramWebhook(req.body);
    res.sendStatus(200);
  } catch (err) {
    console.error("Error handling Telegram webhook:", err);
    res.sendStatus(500);
  }
});

// Mount the router at both /api and /
// This ensures it works in AI Studio (/api/...) and Vercel (/api/index.ts handles /api/...)
app.use("/api", apiRouter);
app.use("/", apiRouter);

// Static file serving in production
if (process.env.NODE_ENV === "production") {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    // Only serve index.html for non-API routes
    if (!req.path.startsWith("/api")) {
      res.sendFile(path.join(distPath, "index.html"));
    } else {
      res.status(404).json({ error: "API route not found" });
    }
  });
}

export default app;
