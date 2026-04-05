import { Request, Response } from "express";
import { db } from "../config/firebase";

export const subscribe = async (req: any, res: Response) => {
  const { planId } = req.body;

  try {
    // In a real app, verify payment with Telebirr/Chapa here
    
    const userRef = db.collection("users").doc(req.user.id);
    await userRef.update({
      subscription_plan: planId,
    });

    // Create subscription record
    await db.collection("subscriptions").add({
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
