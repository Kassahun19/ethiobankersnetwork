import { Request, Response } from "express";
import { db } from "../config/firebase";
import { collection, query, where, orderBy, getDocs, addDoc } from "firebase/firestore";

export const getReferrals = async (req: any, res: Response) => {
  try {
    const referralsRef = collection(db, "referrals");
    const q = query(
      referralsRef,
      where("user_id", "==", req.user.id),
      orderBy("created_at", "desc")
    );
    const querySnapshot = await getDocs(q);
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
    const referralsRef = collection(db, "referrals");
    
    const newReferral = {
      user_id: req.user.id,
      invited_email,
      status: "Pending",
      created_at: new Date().toISOString()
    };
    
    await addDoc(referralsRef, newReferral);
    res.json({ message: "Referral sent successfully" });
  } catch (err: any) {
    console.error("CreateReferral error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
