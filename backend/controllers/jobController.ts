import { Request, Response } from "express";
import { db } from "../config/firebase";
import { notifyNewJob } from "../services/botUtils";

export const getJobs = async (req: Request, res: Response) => {
  try {
    const jobsRef = db.collection("jobs");
    const q = jobsRef.orderBy("created_at", "desc");
    const querySnapshot = await q.get();

    const jobs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(jobs);
  } catch (err: any) {
    console.error("GetJobs error:", err);
    res.status(500).json({ message: "Server error fetching jobs", error: err.message });
  }
};

export const getJobById = async (req: Request, res: Response) => {
  try {
    const jobDocRef = db.collection("jobs").doc(req.params.id);
    const jobDoc = await jobDocRef.get();
    if (!jobDoc.exists) {
      return res.status(404).json({ message: "Job not found" });
    }

    const job = { id: jobDoc.id, ...jobDoc.data() };
    res.json(job);
  } catch (err: any) {
    console.error("GetJobById error:", err);
    res.status(500).json({ message: "Server error fetching job details", error: err.message });
  }
};

export const createJob = async (req: any, res: Response) => {
  const { title, description, bank, salary, location, type, requirements } = req.body;

  try {
    const newJob = {
      title,
      description,
      bank,
      salary,
      location,
      type,
      requirements,
      created_by: req.user.id,
      created_at: new Date().toISOString(),
    };

    const docRef = await db.collection("jobs").add(newJob);
    
    // Notify Telegram
    notifyNewJob(newJob, docRef.id);

    res.status(201).json({ id: docRef.id, ...newJob });
  } catch (err: any) {
    console.error("CreateJob error:", err);
    res.status(500).json({ message: "Server error creating job", error: err.message });
  }
};
