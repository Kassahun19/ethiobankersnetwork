import { Request, Response } from "express";
import { db } from "../config/firebase";

export const applyToJob = async (req: any, res: Response) => {
  const { jobId } = req.body;

  try {
    // Check if already applied
    const appsRef = db.collection("applications");
    const q = appsRef
      .where("user_id", "==", req.user.id)
      .where("job_id", "==", jobId);
    const querySnapshot = await q.get();

    if (!querySnapshot.empty) {
      return res.status(400).json({ message: "You have already applied for this job" });
    }

    const newApplication = {
      user_id: req.user.id,
      job_id: jobId,
      status: "Pending",
      created_at: new Date().toISOString(),
    };

    const docRef = await appsRef.add(newApplication);
    res.status(201).json({ id: docRef.id, ...newApplication });
  } catch (err: any) {
    console.error("ApplyToJob error:", err);
    res.status(500).json({ message: "Server error during application", error: err.message });
  }
};

export const updateApplicationStatus = async (req: any, res: Response) => {
  const { status } = req.body;

  try {
    const appDocRef = db.collection("applications").doc(req.params.id);
    await appDocRef.update({ status });
    res.json({ message: "Application status updated" });
  } catch (err: any) {
    console.error("UpdateStatus error:", err);
    res.status(500).json({ message: "Server error updating status", error: err.message });
  }
};
