import TelegramBot from "node-telegram-bot-api";
import { db } from "../config/firebase.js";

let bot: TelegramBot | null = null;

export const setBot = (botInstance: TelegramBot) => {
  bot = botInstance;
};

export const getBot = () => bot;

export const sendAdminNotification = async (message: string) => {
  if (!bot) {
    console.warn("[BOT-UTILS] Cannot send admin notification: Bot not initialized.");
    return;
  }

  try {
    // 1. Notify hardcoded/env admin
    const adminChatId = process.env.ADMIN_TELEGRAM_CHAT_ID || "5238202513";
    await bot.sendMessage(adminChatId, message, { parse_mode: "Markdown" }).catch(e => console.warn(`Failed to notify primary admin ${adminChatId}:`, e.message));

    // 2. Notify all admins in Firestore
    const usersRef = db.collection("users");
    const adminsSnapshot = await usersRef.where("role", "==", "admin").get();
    
    for (const adminDoc of adminsSnapshot.docs) {
      const adminData = adminDoc.data();
      if (adminData.telegramChatId && adminData.telegramChatId.toString() !== adminChatId) {
        await bot.sendMessage(adminData.telegramChatId, message, { parse_mode: "Markdown" }).catch(e => console.warn(`Failed to notify Firestore admin ${adminData.telegramChatId}:`, e.message));
      }
    }
    
    console.log(`[BOT-UTILS] Admin notifications processed.`);
  } catch (err) {
    console.error("[BOT-UTILS] Error in sendAdminNotification:", err);
  }
};

export const notifyNewJob = async (job: any, jobId: string) => {
  if (!bot) return;

  const channelId = process.env.TELEGRAM_CHANNEL_ID;
  if (channelId) {
    const appUrl = process.env.APP_URL || "https://ethiobankers.vercel.app";
    const message = `🆕 *New Job Alert!*\n\n` +
                    `📌 *${job.title}*\n` +
                    `🏦 Bank: ${job.bank}\n` +
                    `📍 Location: ${job.location}\n` +
                    `🔗 [Apply Now](${appUrl}/jobs/${jobId})`;
    
    try {
      await bot.sendMessage(channelId, message, { parse_mode: "Markdown" });
    } catch (error) {
      console.error("[BOT-UTILS] Error sending job notification to channel:", error);
    }
  }
};
