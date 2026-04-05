import app from "../backend/app";
import { initTelegramBot } from "../backend/services/telegramBot";

// Initialize Telegram Bot for serverless environment
// This ensures the bot is ready to handle webhooks
initTelegramBot();

// Export the Express app for Vercel serverless functions
export default app;
