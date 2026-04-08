import { Request, Response } from "express";
import { db } from "../config/firebase";

export const getReferrals = async (req: any, res: Response) => {
  try {
    const referralsRef = db.collection("referrals");
    const q = referralsRef
      .where("user_id", "==", req.user.id)
      .orderBy("created_at", "desc");
    const querySnapshot = await q.get();
    const referrals = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(referrals);
  } catch (err: any) {
    console.error("GetReferrals error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const createReferral = async (req: any, res: Response) => {
  try {
    const { invited_email } = req.body;
    const referralsRef = db.collection("referrals");
    
    const newReferral = {
      user_id: req.user.id,
      invited_email,
      status: "Pending",
      created_at: new Date().toISOString()
    };
    
    await referralsRef.add(newReferral);
    res.json({ message: "Referral sent successfully" });
  } catch (err: any) {
    console.error("CreateReferral error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
