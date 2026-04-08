import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, getApps } from "firebase-admin/app";
import fs from "fs";
import path from "path";

async function testFirebase() {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
  
  console.log("Using Project ID:", firebaseConfig.projectId);
  
  try {
    if (getApps().length === 0) {
      initializeApp({
        projectId: firebaseConfig.projectId,
        credential: admin.credential.applicationDefault(),
      });
    }
    const db = getFirestore(firebaseConfig.firestoreDatabaseId);
    
    console.log("Attempting to write a test document...");
    await db.collection("test").doc("connection").set({
      timestamp: new Date().toISOString(),
      message: "Admin SDK connection test with explicit ADC"
    });
    console.log("Write successful!");
  } catch (err: any) {
    console.error("Test failed:", err);
  }
}

testFirebase();
