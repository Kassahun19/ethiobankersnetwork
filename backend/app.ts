import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
dotenv.config(); // Load environment variables FIRST

import { fileURLToPath } from 'url';
import bcryptModule from "bcryptjs";
import { db } from "./config/firebase";

// Robust bcrypt import for different environments
const bcrypt = (bcryptModule as any).default || bcryptModule;

console.log("[APP] Starting EthioBankers Backend...");
console.log(`[APP] Node Version: ${process.version}`);
console.log(`[APP] Environment: ${process.env.NODE_ENV}`);

// Import routes
import authRoutes from "./routes/authRoutes";
import jobRoutes from "./routes/jobRoutes";
import userRoutes from "./routes/userRoutes";
import messageRoutes from "./routes/messageRoutes";
import referralRoutes from "./routes/referralRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import applicationRoutes from "./routes/applicationRoutes";
import adminRoutes from "./routes/adminRoutes";

// Process-level error handlers for better debugging on Vercel
process.on("unhandledRejection", (reason, promise) => {
  console.error("[PROCESS] Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("[PROCESS] Uncaught Exception:", err);
});

const app = express();

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());

// API Routes
const apiRouter = express.Router();

apiRouter.use((req, res, next) => {
  // Only log actual API requests, ignore static assets and source files
  const isStaticAsset = req.url.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|tsx|ts|jsx)$/);
  const isApiRoute = req.url.startsWith('/api') || req.originalUrl.startsWith('/api') || !isStaticAsset;

  if (isApiRoute && !isStaticAsset) {
    console.log(`[API-REQUEST]: ${req.method} ${req.url}`);
  }
  next();
});

apiRouter.get("/health", (req, res) => {
  res.json({ status: "ok", message: "EthioBankers Network API" });
});

apiRouter.get("/test-db", async (req, res) => {
  try {
    console.log("[TEST-DB] Attempting to query users collection...");
    const snap = await db.collection("users").limit(1).get();
    res.json({ 
      status: "ok", 
      message: "Firestore connection successful", 
      empty: snap.empty,
      size: snap.size,
      projectId: process.env.FIREBASE_PROJECT_ID || "from-file"
    });
  } catch (err: any) {
    console.error("[TEST-DB] Firestore test failed:", err);
    res.status(500).json({ 
      status: "error", 
      message: err.message, 
      code: err.code,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined
    });
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

apiRouter.get("/test-bcrypt", async (req, res) => {
  try {
    const password = "test-password-123";
    console.log("[TEST-BCRYPT] Hashing...");
    const startHash = Date.now();
    const hash = await bcrypt.hash(password, 10);
    const endHash = Date.now();
    console.log(`[TEST-BCRYPT] Hash complete in ${endHash - startHash}ms: ${hash}`);
    
    console.log("[TEST-BCRYPT] Comparing...");
    const startCompare = Date.now();
    const isMatch = await bcrypt.compare(password, hash);
    const endCompare = Date.now();
    console.log(`[TEST-BCRYPT] Compare complete in ${endCompare - startCompare}ms. Match: ${isMatch}`);
    
    const startCompareWrong = Date.now();
    const isMatchWrong = await bcrypt.compare("wrong-password", hash);
    const endCompareWrong = Date.now();
    
    res.json({ 
      status: "ok", 
      hashTime: `${endHash - startHash}ms`, 
      compareTime: `${endCompare - startCompare}ms`,
      match: isMatch,
      matchWrong: isMatchWrong,
      bcryptType: typeof bcrypt,
      hashType: typeof bcrypt.hash
    });
  } catch (err: any) {
    console.error("[TEST-BCRYPT] Failed:", err);
    res.status(500).json({ status: "error", message: err.message, stack: err.stack });
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
    const { handleTelegramWebhook } = await import("./services/telegramBot");
    await handleTelegramWebhook(req.body);
    res.sendStatus(200);
  } catch (err) {
    console.error("Error handling Telegram webhook:", err);
    res.sendStatus(500);
  }
});

// Mount the router at /api
app.use("/api", apiRouter);

// In production/Vercel, handle static files and SPA fallback
if (process.env.NODE_ENV === "production" || !!process.env.VERCEL) {
  const distPath = path.resolve(process.cwd(), "dist");
  console.log(`[APP] Production mode: Serving from ${distPath}`);
  
  app.use(express.static(distPath, { index: false }));

  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    
    const indexPath = path.join(distPath, "index.html");
    res.sendFile(indexPath, (err) => {
      if (err && !res.headersSent) {
        console.error(`[APP] SPA Fallback Error: ${err.message}`);
        res.status(404).send("Frontend build not found. Please ensure 'npm run build' has been executed.");
      }
    });
  });
}

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("[GLOBAL-ERROR]:", {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body
  });
  res.status(500).json({
    message: "Internal Server Error",
    error: err.message,
    code: err.code || "unknown"
  });
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log(`[APP] Current Working Directory: ${process.cwd()}`);
console.log(`[APP] __dirname: ${__dirname}`);

export default app;
