import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import fs from "fs";
import path from "path";

async function testFirebaseQuery() {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
  
  console.log("Using Project ID:", firebaseConfig.projectId);
  
  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    
    console.log("Attempting to query 'users' collection via client SDK...");
    const q = query(collection(db, "users"), where("email", "==", "test@example.com"));
    const snap = await getDocs(q);
    console.log("Query successful! Found docs:", snap.size);
  } catch (err: any) {
    console.error("Test failed:", err);
  }
}

testFirebaseQuery();
