import { Request, Response } from "express";
import { db } from "../config/firebase";
import { collection, query, where, getDocs, addDoc, doc, updateDoc } from "firebase/firestore";

export const applyToJob = async (req: any, res: Response) => {
  const { jobId } = req.body;

  try {
    // Check if already applied
    const appsRef = collection(db, "applications");
    const q = query(
      appsRef,
      where("user_id", "==", req.user.id),
      where("job_id", "==", jobId)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return res.status(400).json({ message: "You have already applied for this job" });
    }

    const newApplication = {
      user_id: req.user.id,
      job_id: jobId,
      status: "Pending",
      created_at: new Date().toISOString(),
    };

    const docRef = await addDoc(appsRef, newApplication);
    res.status(201).json({ id: docRef.id, ...newApplication });
  } catch (err: any) {
    console.error("ApplyToJob error:", err);
    res.status(500).json({ message: "Server error during application", error: err.message });
  }
};

export const updateApplicationStatus = async (req: any, res: Response) => {
  const { status } = req.body;

  try {
    const appDocRef = doc(db, "applications", req.params.id);
    await updateDoc(appDocRef, { status });
    res.json({ message: "Application status updated" });
  } catch (err: any) {
    console.error("UpdateStatus error:", err);
    res.status(500).json({ message: "Server error updating status", error: err.message });
  }
};
