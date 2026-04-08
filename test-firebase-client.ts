import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import fs from "fs";
import path from "path";

async function testFirebaseClient() {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
  
  console.log("Using Project ID:", firebaseConfig.projectId);
  
  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    
    console.log("Attempting to write a test document via client SDK...");
    const docRef = await addDoc(collection(db, "test"), {
      timestamp: new Date().toISOString(),
      message: "Client SDK connection test via backend"
    });
    console.log("Write successful! ID:", docRef.id);
  } catch (err: any) {
    console.error("Test failed:", err);
  }
}

testFirebaseClient();
