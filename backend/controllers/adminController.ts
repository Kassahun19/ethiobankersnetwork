import { Request, Response } from "express";
import { db } from "../config/firebase";

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const usersRef = db.collection("users");
    const q = usersRef.orderBy("created_at", "desc");
    const querySnapshot = await q.get();
    
    const users = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Remove sensitive data
    const safeUsers = users.map((u: any) => {
      const { password, ...rest } = u;
      return rest;
    });

    res.json(safeUsers);
  } catch (err: any) {
    console.error("Admin: Failed to get users:", err);
    res.status(500).json({ message: "Failed to fetch users", error: err.message });
  }
};

export const getAllReferrals = async (req: Request, res: Response) => {
  try {
    const referralsRef = db.collection("referrals");
    const q = referralsRef.orderBy("created_at", "desc");
    const querySnapshot = await q.get();
    
    const referrals = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json(referrals);
  } catch (err: any) {
    console.error("Admin: Failed to get referrals:", err);
    res.status(500).json({ message: "Failed to fetch referrals", error: err.message });
  }
};
