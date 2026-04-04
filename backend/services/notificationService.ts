import nodemailer from "nodemailer";
import { sendAdminNotification } from "./telegramBot";

const ADMIN_EMAIL = "kmulatu21@gmail.com";

// Configure email transporter
// In a real app, these would be in environment variables
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const notifyAdminOfNewUser = async (user: any) => {
  const message = `🆕 *New User Registered!*\n\n` +
                  `👤 *Name:* ${user.name}\n` +
                  `📧 *Email:* ${user.email}\n` +
                  `📞 *Phone:* ${user.phone || "N/A"}\n` +
                  `🏦 *Bank:* ${user.bank || "N/A"}\n` +
                  `🔑 *Role:* ${user.role}\n` +
                  `📅 *Date:* ${new Date().toLocaleString()}`;

  // 1. Notify via Telegram
  try {
    await sendAdminNotification(message);
    console.log(`Admin notified via Telegram for new user: ${user.email}`);
  } catch (err) {
    console.error("Failed to send Telegram notification to admin:", err);
  }

  // 2. Notify via Email
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    try {
      await transporter.sendMail({
        from: `"EthioBankers Network" <${process.env.EMAIL_USER}>`,
        to: ADMIN_EMAIL,
        subject: "New User Registration - EthioBankers Network",
        text: message.replace(/\*/g, ""), // Remove markdown for plain text email
        html: `
          <h3>New User Registered!</h3>
          <p><strong>Name:</strong> ${user.name}</p>
          <p><strong>Email:</strong> ${user.email}</p>
          <p><strong>Phone:</strong> ${user.phone || "N/A"}</p>
          <p><strong>Bank:</strong> ${user.bank || "N/A"}</p>
          <p><strong>Role:</strong> ${user.role}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
        `,
      });
      console.log(`Admin notified via Email for new user: ${user.email}`);
    } catch (err) {
      console.error("Failed to send email notification to admin:", err);
    }
  } else {
    console.warn("Email notifications skipped: EMAIL_USER or EMAIL_PASS not configured.");
  }
};
