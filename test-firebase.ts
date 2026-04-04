import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

async function test() {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));

  console.log("Config Project ID:", firebaseConfig.projectId);
  console.log("Config Database ID:", firebaseConfig.firestoreDatabaseId);

  try {
    const app = initializeApp({
      projectId: firebaseConfig.projectId,
    });
    const db = getFirestore(firebaseConfig.firestoreDatabaseId);
    
    console.log("Attempting to list collections...");
    const collections = await db.listCollections();
    console.log("Collections found:", collections.map(c => c.id));
  } catch (err: any) {
    console.error("Test failed:", err);
  }
}

test();
