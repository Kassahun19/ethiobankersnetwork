import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import fs from "fs";
import path from "path";

async function testFirebaseCompat() {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
  
  console.log("Using Project ID:", firebaseConfig.projectId);
  
  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    const db = firebase.firestore();
    
    console.log("Attempting to write a test document via compat Client SDK...");
    const docRef = await db.collection("test").add({
      timestamp: new Date().toISOString(),
      message: "Compat Client SDK connection test via backend"
    });
    console.log("Write successful! ID:", docRef.id);
  } catch (err: any) {
    console.error("Test failed:", err);
  }
}

testFirebaseCompat();
