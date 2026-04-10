import TelegramBot from "node-telegram-bot-api";
import { db } from "../config/firebase";
import bcryptModule from "bcryptjs";
import { setBot } from "./botUtils";

// Robust bcrypt import for different environments
const bcrypt = (bcryptModule as any).default || bcryptModule;

const token = process.env.TELEGRAM_BOT_TOKEN || "7664361817:AAH63fDxlqYMtdhkr0AYxBjkwsH1cI54no4";
if (process.env.TELEGRAM_BOT_TOKEN) {
  console.log("Telegram Bot Token loaded from environment.");
} else {
  console.log("Using hardcoded Telegram Bot Token.");
}
console.log(`Using Telegram Token: ${token.substring(0, 5)}...${token.substring(token.length - 5)}`);
let bot: TelegramBot | null = null;

// User state management
type UserState = {
  step: "IDLE" | "LOGIN_CHOOSING_ROLE" | "LOGIN_AWAITING_EMAIL" | "LOGIN_AWAITING_PASSWORD" | 
        "REGISTER_AWAITING_NAME" | "REGISTER_AWAITING_EMAIL" | "REGISTER_AWAITING_PHONE" | "REGISTER_AWAITING_PASSWORD" | 
        "REGISTER_AWAITING_BANK" | "REGISTER_AWAITING_ROLE" | "PREMIUM_AWAITING_RECEIPT";
  data: any;
  isLoggedIn?: boolean;
  user?: any;
};

const PAYMENT_DETAILS = {
  fullName: "Kassahun Mulatu Kebede",
  accounts: [
    { bank: "Commercial Bank of Ethiopia (CBE)", number: "1000183217198" },
    { bank: "Bank of Abyssinia (BOA)", number: "32419186" },
    { bank: "Telebirr/Mobile", number: "0915508167" }
  ]
};

const PREMIUM_PLANS = [
  {
    id: "premium",
    name: "Premium",
    price: "100 ETB / month",
    description: "Accelerate your job search.",
    features: [
      "Unlimited job applications",
      "Verified Banker Badge",
      "AI CV Analysis (Basic)",
      "Priority support",
      "Profile boost in search",
    ]
  },
  {
    id: "pro",
    name: "Pro",
    price: "300 ETB / month",
    description: "For serious career growth.",
    features: [
      "Everything in Premium",
      "Direct Messaging to Employers",
      "Advanced AI Recommendations",
      "Salary insights for roles",
      "Exclusive networking events",
    ]
  }
];

const userStates: { [chatId: number]: UserState } = {};

export const initTelegramBot = () => {
  if (bot) return bot;

  try {
    const isProduction = process.env.NODE_ENV === "production" || !!process.env.VERCEL;
    const appUrl = process.env.APP_URL || "https://ethiobankers.vercel.app";
    
    if (isProduction || process.env.TELEGRAM_WEBHOOK_ENABLED === "true") {
      console.log(`[BOT] Initializing in WEBHOOK mode for ${appUrl}`);
      bot = new TelegramBot(token, { polling: false });
      setBot(bot);
      
      // Only set webhook if explicitly requested via environment variable
      // This avoids redundant network calls on every function invocation
      if (process.env.TELEGRAM_SET_WEBHOOK === "true") {
        const webhookUrl = `${appUrl}/api/telegram-webhook`;
        console.log(`[BOT] Attempting to set Telegram Webhook to: ${webhookUrl}`);
        bot.setWebHook(webhookUrl).then(() => {
          console.log(`[BOT] Telegram Webhook set successfully to: ${webhookUrl}`);
        }).catch(err => {
          console.error("[BOT] Error setting Telegram Webhook:", err);
        });
      } else {
        console.log("[BOT] Webhook mode active, but setWebHook call skipped (TELEGRAM_SET_WEBHOOK not true)");
      }
    } else {
      console.log("[BOT] Initializing in POLLING mode (Development)...");
      bot = new TelegramBot(token, { polling: true });
      setBot(bot);
    }

    bot.on("polling_error", (error) => {
      console.error("Telegram Polling Error:", error);
    });

    bot.on("error", (error) => {
      console.error("Telegram Bot Error:", error);
    });

    console.log("Telegram Bot initialized and polling...");
  } catch (err) {
    console.error("Failed to create TelegramBot instance:", err);
    return null;
  }

  const getMainMenuKeyboard = (chatId: number) => {
    const state = userStates[chatId];
    const isLoggedIn = state?.isLoggedIn;
    const isAdmin = state?.user?.role === "admin";

    const keyboard: any[][] = [
      [{ text: "🏢 About Us" }, { text: "📞 Contact Us" }],
      isLoggedIn 
        ? [{ text: "🚪 Logout" }, { text: "👤 My Profile" }]
        : [{ text: "🔐 Login" }, { text: "📝 Register" }],
      [{ text: "🚀 Latest Jobs" }, { text: "📢 News" }],
      [{ text: "❓ Help" }, { text: "📜 Terms & Conditions" }]
    ];

    if (isLoggedIn) {
      if (isAdmin) {
        keyboard.push([{ text: "📥 Manage Payments" }, { text: "➕ Post Job" }]);
      } else {
        keyboard.push([{ text: "💎 Go Premium" }]);
      }
    }

    const appUrl = process.env.APP_URL || "https://ethiobankers.vercel.app";
    keyboard.push([{ text: "📱 Open Web App", web_app: { url: appUrl } }]);
    keyboard.push([{ text: "≡ Menu" }]);

    return {
      reply_markup: {
        keyboard,
        resize_keyboard: true,
        one_time_keyboard: false
      }
    };
  };

  const menuInlineButton = {
    reply_markup: {
      inline_keyboard: [
        [{ text: "≡ Menu", callback_data: "main_menu" }]
      ]
    }
  };

  const loginKeyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "👨‍💼 Admin", callback_data: "login_admin" },
          { text: "👤 User", callback_data: "login_user" }
        ],
        [{ text: "≡ Menu", callback_data: "main_menu" }]
      ]
    }
  };

  const sendLatestJobs = async (chatId: number) => {
    try {
      if (!userStates[chatId]) {
        userStates[chatId] = { step: "IDLE", data: {} };
      }
      const state = userStates[chatId];
      const isPremium = state?.isLoggedIn && (state?.user?.subscription_plan === "premium" || state?.user?.subscription_plan === "pro" || state?.user?.role === "admin");

      const jobsRef = db.collection("jobs");
      const querySnapshot = await jobsRef.orderBy("created_at", "desc").limit(5).get();

      if (querySnapshot.empty) {
        bot?.sendMessage(chatId, "No jobs found at the moment. Check back later!", menuInlineButton as any);
        return;
      }

      await bot?.sendMessage(chatId, "🚀 *Latest Banking Jobs:*", { parse_mode: "Markdown" });

      for (const doc of querySnapshot.docs) {
        const job = doc.data();
        let jobMsg = `📌 *${job.title}*\n`;
        jobMsg += `🏦 *Bank:* ${job.bank}\n`;
        jobMsg += `📍 *Location:* ${job.location}\n`;
        jobMsg += `💰 *Salary:* ${job.salary || "Negotiable"}\n`;
        jobMsg += `🕒 *Type:* ${job.type || "Full-time"}\n`;
        
        const buttonText = isPremium ? `🔍 View Details` : `🔒 View Details`;
        
        await bot?.sendMessage(chatId, jobMsg, {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: buttonText, callback_data: `view_job_${doc.id}` }]
            ]
          }
        });
      }

      bot?.sendMessage(chatId, "Use the menu below for more options:", menuInlineButton as any);
    } catch (error) {
      console.error("Error fetching jobs for Telegram:", error);
      bot?.sendMessage(chatId, "Sorry, I encountered an error while fetching jobs.", menuInlineButton as any);
    }
  };

  bot.onText(/\/testdb/, async (msg) => {
    const chatId = msg.chat.id;
    bot?.sendMessage(chatId, "🔍 Testing Firestore connection...");
    try {
      const start = Date.now();
      const snap = await db.collection("users").limit(1).get();
      const end = Date.now();
      bot?.sendMessage(chatId, `✅ Firestore connection successful!\n⏱️ Response time: ${end - start}ms\n👥 Users found: ${snap.size}`);
    } catch (err: any) {
      console.error("[BOT-TESTDB] Error:", err);
      bot?.sendMessage(chatId, `❌ Firestore connection failed: ${err.message}`);
    }
  });

  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    if (!userStates[chatId]) {
      userStates[chatId] = { step: "IDLE", data: {} };
    }
    const firstName = msg.from?.first_name || "Banker";
    bot?.sendMessage(
      chatId,
      `Welcome to EthioBankers Network, ${firstName}! 👋\n\nI am your modern assistant for the Ethiopian banking job market. How can I help you today?`,
      getMainMenuKeyboard(chatId) as any
    ).catch(err => console.error(`Error sending /start message to ${chatId}:`, err));
  });

  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    console.log(`Telegram Message from ${chatId}: ${text || "[No Text]"}`);

    if (!text) return;

    const state = userStates[chatId] || { step: "IDLE", data: {} };
    if (!userStates[chatId]) userStates[chatId] = state;

    if (text === "≡ Menu" || text === "/menu" || text === "Menu") {
      state.step = "IDLE";
      state.data = {};
      bot?.sendMessage(chatId, "Showing main menu...", getMainMenuKeyboard(chatId) as any);
      return;
    }

    // Handle multi-step flows
    if (state.step !== "IDLE") {
      switch (state.step) {
        case "LOGIN_CHOOSING_ROLE":
          if (text === "👨‍💼 Admin" || text === "👤 User") {
            state.data.role = text === "👨‍💼 Admin" ? "admin" : "user";
            state.step = "LOGIN_AWAITING_EMAIL";
            bot?.sendMessage(chatId, `Logging in as ${state.data.role}. Please enter your registered email address:`, {
              reply_markup: { remove_keyboard: true }
            });
          } else {
            bot?.sendMessage(chatId, "Please select a valid role using the buttons below.");
          }
          return;

        case "LOGIN_AWAITING_EMAIL":
          state.data.email = text.trim().toLowerCase();
          state.step = "LOGIN_AWAITING_PASSWORD";
          bot?.sendMessage(chatId, "Excellent. Now, please enter your password:");
          return;

        case "LOGIN_AWAITING_PASSWORD":
          state.data.password = text.trim();
          bot?.sendMessage(chatId, "Verifying credentials... ⏳");
          
          try {
            console.log(`[BOT-LOGIN] Attempting login for ${state.data.email}`);
            const usersRef = db.collection("users");
            
            // Add a timeout to the query
            const queryPromise = usersRef.where("email", "==", state.data.email).get();
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Database timeout")), 10000));
            
            const querySnapshot = await Promise.race([queryPromise, timeoutPromise]) as any;

            if (querySnapshot.empty) {
              console.warn(`[BOT-LOGIN] User not found: ${state.data.email}`);
              bot?.sendMessage(chatId, "❌ Invalid email. Please enter your registered email address again:");
              state.step = "LOGIN_AWAITING_EMAIL";
              return;
            }

            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data();

            const isMatch = await bcrypt.compare(state.data.password, userData.password);
            if (!isMatch) {
              bot?.sendMessage(chatId, "❌ Invalid password. Please enter your password again:");
              state.step = "LOGIN_AWAITING_PASSWORD";
              return;
            }

            const user: any = { id: userDoc.id, ...userData };
            delete user.password;

            // Store telegramChatId for notifications
            try {
              await db.collection("users").doc(userDoc.id).update({ telegramChatId: chatId });
            } catch (updateErr) {
              console.warn("Failed to update telegramChatId, but proceeding with login:", updateErr);
            }

            state.isLoggedIn = true;
            state.user = user;
            state.step = "IDLE";
            state.data = {};

            bot?.sendMessage(chatId, `✅ Login successful! Welcome back, ${userData.name || "Banker"}. You are now in your ${userData.role === "admin" ? "Admin" : "User"} dashboard.`, getMainMenuKeyboard(chatId) as any);
          } catch (error: any) {
            console.error("Telegram Login Error:", error);
            bot?.sendMessage(chatId, `❌ An error occurred during login: ${error.message || "Unknown error"}. Please try again later.`, getMainMenuKeyboard(chatId) as any);
            state.step = "IDLE";
            state.data = {};
          }
          return;

        case "REGISTER_AWAITING_NAME":
          state.data.name = text.trim();
          state.step = "REGISTER_AWAITING_EMAIL";
          bot?.sendMessage(chatId, `Nice to meet you, ${state.data.name}! Now, please enter your email address:`);
          return;

        case "REGISTER_AWAITING_EMAIL":
          state.data.email = text.trim().toLowerCase();
          state.step = "REGISTER_AWAITING_PHONE";
          bot?.sendMessage(chatId, "Great. Now, please enter your phone number:");
          return;

        case "REGISTER_AWAITING_PHONE":
          state.data.phone = text.trim();
          state.step = "REGISTER_AWAITING_PASSWORD";
          bot?.sendMessage(chatId, "Excellent. Please choose a secure password:");
          return;

        case "REGISTER_AWAITING_PASSWORD":
          state.data.password = text.trim();
          state.step = "REGISTER_AWAITING_BANK";
          bot?.sendMessage(chatId, "Which bank do you currently work for? (or enter 'None' if applicable):");
          return;

        case "REGISTER_AWAITING_BANK":
          state.data.bank = text;
          state.step = "REGISTER_AWAITING_ROLE";
          bot?.sendMessage(chatId, "Finally, what is your role?", {
            reply_markup: {
              keyboard: [[{ text: "👨‍💼 Admin" }, { text: "👤 User" }]],
              resize_keyboard: true,
              one_time_keyboard: true
            }
          });
          return;

        case "REGISTER_AWAITING_ROLE":
          if (text === "👨‍💼 Admin" || text === "👤 User") {
            state.data.role = text === "👨‍💼 Admin" ? "admin" : "user";
            bot?.sendMessage(chatId, "Creating your account... ⏳");

            try {
              console.log(`[BOT-REGISTER] Attempting registration for ${state.data.email}`);
              const usersRef = db.collection("users");
              
              // Check if user exists with timeout
              const checkPromise = usersRef.where("email", "==", state.data.email).get();
              const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Database timeout")), 10000));
              
              const querySnapshot = await Promise.race([checkPromise, timeoutPromise]) as any;

              if (!querySnapshot.empty) {
                console.warn(`[BOT-REGISTER] Email already exists: ${state.data.email}`);
                bot?.sendMessage(chatId, "❌ This email is already registered. Please try logging in.", getMainMenuKeyboard(chatId) as any);
                userStates[chatId] = { step: "IDLE", data: {} };
                return;
              }

              console.log(`[BOT-REGISTER] Hashing password for ${state.data.email}`);
              const hashedPassword = await bcrypt.hash(state.data.password, 10);
              
              const newUser = {
                name: state.data.name,
                email: state.data.email,
                phone: state.data.phone,
                password: hashedPassword,
                bank: state.data.bank,
                role: state.data.role,
                is_verified: false,
                subscription_plan: "free",
                created_at: new Date().toISOString(),
                telegramChatId: chatId,
                source: "telegram_bot"
              };

              console.log(`[BOT-REGISTER] Adding user to Firestore: ${state.data.email}`);
              await usersRef.add(newUser);
              console.log(`[BOT-REGISTER] User added successfully: ${state.data.email}`);
              
              // Notify Admin
              try {
                const { notifyAdminOfNewUser } = await import("./notificationService");
                notifyAdminOfNewUser({ ...newUser, id: "telegram_user" }).catch(err => console.error("Admin notification failed:", err));
              } catch (notifyErr) {
                console.error("Failed to import notificationService:", notifyErr);
              }

              bot?.sendMessage(chatId, `🎉 Registration successful! Welcome to the EthioBankers Network, ${state.data.name}. You can now use the menu to explore jobs.`, getMainMenuKeyboard(chatId) as any);
              state.step = "IDLE";
              state.data = {};
            } catch (error: any) {
              console.error("Telegram Register Error:", error);
              bot?.sendMessage(chatId, `❌ An error occurred during registration: ${error.message || "Unknown error"}. Please try again later.`, getMainMenuKeyboard(chatId) as any);
              state.step = "IDLE";
              state.data = {};
            }
          } else {
            bot?.sendMessage(chatId, "Please select a valid role using the buttons below.");
          }
          return;

        case "PREMIUM_AWAITING_RECEIPT":
          // Handle receipt submission (text, photo, or document)
          try {
            bot?.sendMessage(chatId, "⏳ Processing your submission...");
            
            let receipt_data = text || "";
            let receipt_type: "text" | "photo" | "document" = "text";
            let file_id = "";

            if (msg.photo && msg.photo.length > 0) {
              receipt_type = "photo";
              file_id = msg.photo[msg.photo.length - 1].file_id;
              receipt_data = msg.caption || "Photo Receipt";
            } else if (msg.document) {
              receipt_type = "document";
              file_id = msg.document.file_id;
              receipt_data = msg.caption || msg.document.file_name || "Document Receipt";
            }

            const paymentsRef = db.collection("payment_requests");
            const planName = state.data.selectedPlan || "Premium";
            
            await paymentsRef.add({
              user_id: state.user.id,
              user_name: state.user.name,
              user_email: state.user.email,
              receipt_data,
              receipt_type,
              file_id,
              plan_name: planName,
              status: "Pending",
              created_at: new Date().toISOString()
            });

            bot?.sendMessage(chatId, `✅ Your submission for the *${planName} Plan* is successful and is waiting approval from the admin within 24 hours. You will be notified once approved.`, { parse_mode: "Markdown", ...getMainMenuKeyboard(chatId) } as any);
            
            // Notify Admins
            const usersRef = db.collection("users");
            const adminsSnapshot = await usersRef.where("role", "==", "admin").get();
            adminsSnapshot.docs.forEach(adminDoc => {
              const adminData = adminDoc.data();
              if (adminData.telegramChatId) {
                bot?.sendMessage(adminData.telegramChatId, `📥 *New Payment Request*\n\n👤 *User:* ${state.user.name}\n📧 *Email:* ${state.user.email}\n💎 *Plan:* ${planName}\n\nCheck "Manage Payments" to review.`, { parse_mode: "Markdown" });
              }
            });

            state.step = "IDLE";
            state.data = {};
          } catch (error) {
            console.error("Premium Submission Error:", error);
            bot?.sendMessage(chatId, "❌ Failed to submit receipt. Please try again.", getMainMenuKeyboard(chatId) as any);
            state.step = "IDLE";
            state.data = {};
          }
          return;
      }
    }

    switch (text) {
      case "🏢 About Us":
        bot?.sendMessage(
          chatId,
          "*EthioBankers Network* 🏦\n\nWe are the leading professional network for banking experts in Ethiopia. Our mission is to connect talent with opportunity and foster growth in the financial sector.",
          { parse_mode: "Markdown", ...menuInlineButton } as any
        );
        break;

      case "📞 Contact Us":
        bot?.sendMessage(
          chatId,
          "📧 *Email:* support@ethiobankers.net\n🌐 *Website:* [ethiobankers.net](https://ethiobankers.net)\n📍 *Address:* Addis Ababa, Ethiopia\n\nFeel free to reach out for any inquiries!",
          { parse_mode: "Markdown", ...menuInlineButton } as any
        );
        break;

      case "🔐 Login":
        userStates[chatId] = { step: "LOGIN_CHOOSING_ROLE", data: {} };
        bot?.sendMessage(
          chatId,
          "Please choose your login type to proceed:",
          {
            reply_markup: {
              keyboard: [[{ text: "👨‍💼 Admin" }, { text: "👤 User" }]],
              resize_keyboard: true,
              one_time_keyboard: true
            }
          }
        );
        break;

      case "📝 Register":
        state.step = "REGISTER_AWAITING_NAME";
        state.data = {};
        bot?.sendMessage(chatId, "Welcome! Let's get you registered. First, please enter your full name:", {
          reply_markup: { remove_keyboard: true }
        });
        break;

      case "🚪 Logout":
        state.isLoggedIn = false;
        state.user = null;
        state.step = "IDLE";
        state.data = {};
        bot?.sendMessage(chatId, "👋 You have been logged out successfully.", getMainMenuKeyboard(chatId) as any);
        break;

      case "💎 Go Premium":
        if (!state.isLoggedIn) {
          bot?.sendMessage(chatId, "Please login first to go premium.", getMainMenuKeyboard(chatId) as any);
          break;
        }
        
        let plansMsg = `🌟 *Upgrade Your Career with EthioBankers Network!*\n\n`;
        plansMsg += `Choose the plan that fits your professional goals and unlock the full potential of our network.\n\n`;
        
        PREMIUM_PLANS.forEach(plan => {
          plansMsg += `💎 *${plan.name} Plan* - ${plan.price}\n`;
          plansMsg += `_${plan.description}_\n`;
          plan.features.forEach(feature => {
            plansMsg += `• ${feature}\n`;
          });
          plansMsg += `\n`;
        });

        bot?.sendMessage(chatId, plansMsg, {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              ...PREMIUM_PLANS.map(plan => [{ text: `Upgrade to ${plan.name}`, callback_data: `subscribe_${plan.id}` }]),
              [{ text: "≡ Menu", callback_data: "main_menu" }]
            ]
          }
        });
        break;

      case "📥 Manage Payments":
        if (state.user?.role !== "admin") {
          bot?.sendMessage(chatId, "Access denied. Admins only.", getMainMenuKeyboard(chatId) as any);
          break;
        }
        
        try {
          const paymentsRef = db.collection("payment_requests");
          const pendingSnapshot = await paymentsRef.where("status", "==", "Pending").limit(5).get();
          
          if (pendingSnapshot.empty) {
            bot?.sendMessage(chatId, "✅ No pending payment requests.", getMainMenuKeyboard(chatId) as any);
            break;
          }

          bot?.sendMessage(chatId, `📥 *Pending Payments (${pendingSnapshot.size}):*`, { parse_mode: "Markdown" });
          
          for (const doc of pendingSnapshot.docs) {
            const req = doc.data();
            const caption = `👤 *User:* ${req.user_name}\n📧 *Email:* ${req.user_email}\n💎 *Plan:* ${req.plan_name || "Premium"}\n📄 *Receipt:* ${req.receipt_data}\n📅 *Date:* ${new Date(req.created_at).toLocaleString()}`;
            
            const options: any = {
              parse_mode: "Markdown",
              reply_markup: {
                inline_keyboard: [
                  [
                    { text: "✅ Approve", callback_data: `approve_pay_${doc.id}` },
                    { text: "❌ Reject", callback_data: `reject_pay_${doc.id}` }
                  ]
                ]
              }
            };

            if (req.receipt_type === "photo" && req.file_id) {
              await bot?.sendPhoto(chatId, req.file_id, { ...options, caption });
            } else if (req.receipt_type === "document" && req.file_id) {
              await bot?.sendDocument(chatId, req.file_id, { ...options, caption });
            } else {
              await bot?.sendMessage(chatId, caption, options);
            }
          }
        } catch (error) {
          console.error("Manage Payments Error:", error);
          bot?.sendMessage(chatId, "Error fetching payments.", getMainMenuKeyboard(chatId) as any);
        }
        break;

      case "🚀 Latest Jobs":
        await sendLatestJobs(chatId);
        break;

      case "📢 News":
        bot?.sendMessage(
          chatId,
          "📢 *Latest News from EthioBankers Network*\n\n- New banking regulations announced for 2026.\n- EthioBankers Network hits 10,000 members!\n- Upcoming webinar: 'The Future of Fintech in Ethiopia'.",
          { parse_mode: "Markdown", ...menuInlineButton } as any
        );
        break;

      case "❓ Help":
        bot?.sendMessage(
          chatId,
          "💡 *How to use this bot:*\n\n1. Use the buttons below to navigate.\n2. Click *Latest Jobs* to see current openings.\n3. *Login/Register* directly here in the chat.\n4. Use the *Menu* button anytime to see options.",
          { parse_mode: "Markdown", ...menuInlineButton } as any
        );
        break;

      case "📜 Terms & Conditions":
        bot?.sendMessage(
          chatId,
          "⚖️ *Terms & Conditions*\n\nBy using EthioBankers Network, you agree to our terms of service regarding data privacy, professional conduct, and job application processes. View full terms on our website.",
          { parse_mode: "Markdown", ...menuInlineButton } as any
        );
        break;

      case "👤 My Profile":
        if (state.isLoggedIn && state.user) {
          const user = state.user;
          let profileMsg = `👤 *My Profile*\n\n`;
          profileMsg += `📛 *Name:* ${user.name || "N/A"}\n`;
          profileMsg += `📧 *Email:* ${user.email || "N/A"}\n`;
          profileMsg += `📞 *Phone:* ${user.phone || "N/A"}\n`;
          profileMsg += `🏦 *Bank:* ${user.bank || "N/A"}\n`;
          profileMsg += `🔑 *Role:* ${user.role === "admin" ? "Admin" : "User"}\n`;
          profileMsg += `💎 *Plan:* ${user.subscription_plan ? user.subscription_plan.charAt(0).toUpperCase() + user.subscription_plan.slice(1) : "Free"}\n\n`;
          profileMsg += `📅 *Member Since:* ${user.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}\n\n`;
          profileMsg += `Use the menu below to navigate or update your settings on our web app.`;

          bot?.sendMessage(chatId, profileMsg, {
            parse_mode: "Markdown",
            ...getMainMenuKeyboard(chatId)
          } as any);
        } else {
          bot?.sendMessage(
            chatId,
            "To view your profile, please log in to your account first.",
            {
              reply_markup: {
                keyboard: [[{ text: "🔐 Login" }], [{ text: "≡ Menu" }]],
                resize_keyboard: true,
                one_time_keyboard: true
              }
            }
          );
        }
        break;
    }
  });

  bot.on("callback_query", (query) => {
    const chatId = query.message?.chat.id;
    if (!chatId) return;

    if (!userStates[chatId]) {
      userStates[chatId] = { step: "IDLE", data: {} };
    }
    const state = userStates[chatId];

    if (query.data === "main_menu") {
      state.step = "IDLE";
      state.data = {};
      bot?.sendMessage(chatId, "Returning to main menu...", getMainMenuKeyboard(chatId) as any);
    } else if (query.data === "go_premium") {
      // Re-trigger the Go Premium logic
      const state = userStates[chatId];
      if (!state?.isLoggedIn) {
        bot?.sendMessage(chatId, "Please login first to go premium.", getMainMenuKeyboard(chatId) as any);
        return;
      }
      
      let plansMsg = `🌟 *Upgrade Your Career with EthioBankers Network!*\n\n`;
      plansMsg += `Choose the plan that fits your professional goals and unlock the full potential of our network.\n\n`;
      
      PREMIUM_PLANS.forEach(plan => {
        plansMsg += `💎 *${plan.name} Plan* - ${plan.price}\n`;
        plansMsg += `_${plan.description}_\n`;
        plan.features.forEach(feature => {
          plansMsg += `• ${feature}\n`;
        });
        plansMsg += `\n`;
      });

      bot?.sendMessage(chatId, plansMsg, {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            ...PREMIUM_PLANS.map(plan => [{ text: `Upgrade to ${plan.name}`, callback_data: `subscribe_${plan.id}` }]),
            [{ text: "≡ Menu", callback_data: "main_menu" }]
          ]
        }
      });
    } else if (query.data?.startsWith("subscribe_")) {
      const planId = query.data.replace("subscribe_", "");
      const plan = PREMIUM_PLANS.find(p => p.id === planId);
      if (!plan) return;

      state.data.selectedPlan = plan.name; // Store selected plan name
      let paymentMsg = `🌟 *Upgrade to ${plan.name} Plan*\n\n`;
      paymentMsg += `Price: *${plan.price}*\n\n`;
      paymentMsg += `👤 *Account Holder:* ${PAYMENT_DETAILS.fullName}\n\n`;
      paymentMsg += `🏦 *Payment Methods:*\n`;
      PAYMENT_DETAILS.accounts.forEach(acc => {
        paymentMsg += `• ${acc.bank}: \`${acc.number}\`\n`;
      });
      
      paymentMsg += `\n🚀 *Steps to upgrade:*\n`;
      paymentMsg += `1. Deposit the subscription fee to any of the accounts above.\n`;
      paymentMsg += `2. Take a screenshot or copy the transaction reference.\n`;
      paymentMsg += `3. Click the button below to submit your receipt.\n`;
      paymentMsg += `4. Wait for admin approval (usually within 1-2 hours).`;

      bot?.sendMessage(chatId, paymentMsg, {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "📤 Submit Receipt", callback_data: "submit_receipt" }],
            [{ text: "⬅️ Back to Plans", callback_data: "go_premium" }]
          ]
        }
      });
    } else if (query.data?.startsWith("view_job_") || query.data?.startsWith("close_job_")) {
      const isClosing = query.data.startsWith("close_job_");
      const jobId = query.data.replace(isClosing ? "close_job_" : "view_job_", "");
      const messageId = query.message?.message_id;
      const state = userStates[chatId];
      const isPremium = state?.isLoggedIn && (state?.user?.subscription_plan === "premium" || state?.user?.subscription_plan === "pro" || state?.user?.role === "admin");

      const updateJobMessage = async () => {
        try {
          const jobSnap = await db.collection("jobs").doc(jobId).get();

          if (!jobSnap.exists) {
            bot?.answerCallbackQuery(query.id, { text: "❌ Job not found." });
            return;
          }

          const job = jobSnap.data()!;
          let jobMsg = `📌 *${job.title}*\n`;
          jobMsg += `🏦 *Bank:* ${job.bank}\n`;
          jobMsg += `📍 *Location:* ${job.location}\n`;
          jobMsg += `💰 *Salary:* ${job.salary || "Negotiable"}\n`;
          jobMsg += `🕒 *Type:* ${job.type || "Full-time"}\n`;

          if (isClosing) {
            const buttonText = isPremium ? `🔍 View Details` : `🔒 View Details`;
            bot?.editMessageText(jobMsg, {
              chat_id: chatId,
              message_id: messageId,
              parse_mode: "Markdown",
              reply_markup: {
                inline_keyboard: [[{ text: buttonText, callback_data: `view_job_${jobId}` }]]
              }
            });
          } else if (!isPremium) {
            jobMsg += `\n🔒 *Premium Feature*\n_Please upgrade to a Premium or Pro plan to view full job details and application processes._`;
            bot?.editMessageText(jobMsg, {
              chat_id: chatId,
              message_id: messageId,
              parse_mode: "Markdown",
              reply_markup: {
                inline_keyboard: [
                  [{ text: "💎 Go Premium", callback_data: "go_premium" }],
                  [{ text: "❌ Close Details", callback_data: `close_job_${jobId}` }]
                ]
              }
            });
          } else {
            jobMsg += `\n📝 *Description:*\n${job.description}\n\n`;
            
            if (job.requirements && Array.isArray(job.requirements)) {
              jobMsg += `✅ *Requirements:*\n`;
              job.requirements.forEach((req: string) => {
                jobMsg += `• ${req}\n`;
              });
              jobMsg += `\n`;
            }

            jobMsg += `🚀 *Application Process:*\n`;
            jobMsg += `To apply for this position, please visit our web app or follow the instructions provided by the bank. Most banking applications in Ethiopia require physical submission or their specific online portal.\n\n`;
            const appUrl = process.env.APP_URL || "https://ethiobankers.vercel.app";
            jobMsg += `🔗 [Open in Web App](${appUrl}/jobs/${jobId})`;

            bot?.editMessageText(jobMsg, {
              chat_id: chatId,
              message_id: messageId,
              parse_mode: "Markdown",
              reply_markup: {
                inline_keyboard: [
                  [{ text: "❌ Close Details", callback_data: `close_job_${jobId}` }]
                ]
              }
            });
          }
        } catch (error) {
          console.error("Error updating job message:", error);
          bot?.answerCallbackQuery(query.id, { text: "❌ Error updating details." });
        }
      };
      updateJobMessage();
    } else if (query.data === "latest_jobs_callback") {
      sendLatestJobs(chatId);
    } else if (query.data === "login_admin" || query.data === "login_user") {
      state.step = "LOGIN_AWAITING_EMAIL";
      state.data = { role: query.data === "login_admin" ? "admin" : "user" };
      bot?.sendMessage(chatId, `Logging in as ${state.data.role}. Please enter your registered email address:`, {
        reply_markup: { remove_keyboard: true }
      });
    } else if (query.data === "submit_receipt") {
      state.step = "PREMIUM_AWAITING_RECEIPT";
      bot?.sendMessage(chatId, "Please paste your transaction reference or describe your payment (e.g., 'Paid via Telebirr, Ref: 12345'). You can also send a photo of the receipt.");
    } else if (query.data?.startsWith("approve_pay_")) {
      const requestId = query.data.replace("approve_pay_", "");
      handlePaymentApproval(chatId, requestId, true);
    } else if (query.data?.startsWith("reject_pay_")) {
      const requestId = query.data.replace("reject_pay_", "");
      handlePaymentApproval(chatId, requestId, false);
    }
    bot?.answerCallbackQuery(query.id);
  });

  const handlePaymentApproval = async (adminChatId: number, requestId: string, approved: boolean) => {
    try {
      const requestRef = db.collection("payment_requests").doc(requestId);
      const requestSnap = await requestRef.get();
      
      if (!requestSnap.exists) {
        bot?.sendMessage(adminChatId, "❌ Request not found.");
        return;
      }

      const requestData = requestSnap.data()!;
      const userRef = db.collection("users").doc(requestData.user_id);
      const userSnap = await userRef.get();
      const userData = userSnap.data();

      if (approved) {
        await requestRef.update({ status: "Approved" });
        await userRef.update({ subscription_plan: "premium" });
        bot?.sendMessage(adminChatId, `✅ Approved payment for ${requestData.user_name}. User is now Premium.`);
        
        if (userData?.telegramChatId) {
          bot?.sendMessage(userData.telegramChatId, "🌟 *Congratulations!*\n\nYour premium subscription has been approved. You now have full access to all premium features on EthioBankers Network!", { parse_mode: "Markdown" });
        }
      } else {
        await requestRef.update({ status: "Rejected" });
        bot?.sendMessage(adminChatId, `❌ Rejected payment for ${requestData.user_name}.`);
        
        if (userData?.telegramChatId) {
          bot?.sendMessage(userData.telegramChatId, "❌ *Premium Request Update*\n\nYour premium subscription request was rejected. Please ensure your payment details are correct and try again.", { parse_mode: "Markdown" });
        }
      }
    } catch (error) {
      console.error("Payment Approval Error:", error);
      bot?.sendMessage(adminChatId, "❌ Error processing approval.");
    }
  };

  bot.onText(/\/jobs/, async (msg) => {
    const chatId = msg.chat.id;
    await sendLatestJobs(chatId);
  });

  return bot;
};

export const handleTelegramWebhook = async (body: any) => {
  const currentBot = initTelegramBot();
  if (currentBot) {
    // In serverless, we need to ensure the process stays alive long enough
    // to complete the processing. Since processUpdate doesn't return a promise,
    // we'll add a small delay to allow async operations to start.
    currentBot.processUpdate(body);
    await new Promise(resolve => setTimeout(resolve, 1000));
  } else {
    console.error("Cannot handle Telegram webhook: Bot not initialized.");
  }
};

export default bot;
