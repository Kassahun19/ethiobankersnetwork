import { Request, Response } from "express";
import { db } from "../config/firebase";
import { doc, updateDoc, collection, addDoc } from "firebase/firestore";

export const subscribe = async (req: any, res: Response) => {
  const { planId } = req.body;

  try {
    // In a real app, verify payment with Telebirr/Chapa here
    
    const userRef = doc(db, "users", req.user.id);
    await updateDoc(userRef, {
      subscription_plan: planId,
    });

    // Create subscription record
    await addDoc(collection(db, "subscriptions"), {
      user_id: req.user.id,
      plan: planId,
      status: "Active",
      payment_ref: "DEMO_" + Math.random().toString(36).substring(7),
      created_at: new Date().toISOString(),
    });

    res.json({ message: "Subscription successful", plan: planId });
  } catch (err: any) {
    console.error("Subscription error:", err);
    res.status(500).json({ message: "Server error during subscription", error: err.message });
  }
};
