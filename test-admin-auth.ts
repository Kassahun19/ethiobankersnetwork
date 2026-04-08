import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import fs from "fs";
import path from "path";

async function testAdminAuth() {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
  
  try {
    if (getApps().length === 0) {
      initializeApp({
        projectId: firebaseConfig.projectId,
      });
    }
    const auth = getAuth();
    console.log("Attempting to create a custom token...");
    const token = await auth.createCustomToken("backend-admin");
    console.log("Custom token created successfully!");
  } catch (err: any) {
    console.error("Test failed:", err);
  }
}

testAdminAuth();
