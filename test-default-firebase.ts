import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

async function testDefaultFirebase() {
  try {
    if (getApps().length === 0) {
      initializeApp();
    }
    const db = getFirestore();
    console.log("Attempting to write to (default) database of default project...");
    const docRef = await db.collection("test").add({
      timestamp: new Date().toISOString(),
      message: "Admin SDK default project test"
    });
    console.log("Write successful! ID:", docRef.id);
  } catch (err: any) {
    console.error("Test failed:", err);
  }
}

testDefaultFirebase();
