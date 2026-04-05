import { initializeApp } from "firebase/app";
import { initializeFirestore, getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import fs from "fs";
import path from "path";

let firebaseConfig: any = {};
try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
  } else {
    console.warn("firebase-applet-config.json not found. Firebase Client SDK may not be fully functional.");
  }
} catch (err) {
  console.error("Error reading firebase-applet-config.json:", err);
}

// Initialize Firebase Client SDK for backend use
let app: any;
try {
  app = initializeApp(firebaseConfig);
} catch (err) {
  console.error("Failed to initialize Firebase Client SDK:", err);
  app = initializeApp({ apiKey: "mock-key", projectId: "mock-project" }); // Fallback to prevent downstream crashes
}

// Export the Firestore and Auth instances
// We use the named database if provided in the config
// Enabling long polling for better stability in serverless environments
const databaseId = firebaseConfig.firestoreDatabaseId || "(default)";
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, databaseId);

export const auth = getAuth(app);

// Do not re-export everything to avoid ambiguity (e.g., Unsubscribe)
// Controllers should import directly from firebase/firestore or firebase/auth
