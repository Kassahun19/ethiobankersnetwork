import dotenv from "dotenv";
import { initTelegramBot } from "./backend/services/telegramBot";

// Load environment variables
dotenv.config();

console.log("==========================================");
console.log("🤖 EthioBankers Telegram Bot Worker Starting...");
console.log("==========================================");

try {
  const isProduction = process.env.NODE_ENV === "production" || !!process.env.VERCEL;
  const webhookEnabled = process.env.TELEGRAM_WEBHOOK_ENABLED === "true";

  if (isProduction && webhookEnabled) {
    console.log("ℹ️ Bot is configured for WEBHOOK mode in production.");
    console.log("ℹ️ The main server will handle incoming messages. Worker exiting...");
    process.exit(0);
  }
  
  // Force polling mode for the standalone worker
  process.env.TELEGRAM_WEBHOOK_ENABLED = "false";
  console.log("🔄 Starting bot in POLLING mode...");
  initTelegramBot();
  console.log("✅ Bot worker initialized and listening.");
} catch (err) {
  console.error("❌ Failed to start Bot worker:", err);
  process.exit(1);
}

// Keep the process alive
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception in Bot Worker:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection in Bot Worker at:", promise, "reason:", reason);
});
