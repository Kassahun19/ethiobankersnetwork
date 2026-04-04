import { Request, Response } from "express";
import { db } from "../config/firebase";
import { collection, query, orderBy, getDocs, doc, getDoc, addDoc } from "firebase/firestore";
import { notifyNewJob } from "../services/telegramBot";

export const getJobs = async (req: Request, res: Response) => {
  try {
    const jobsRef = collection(db, "jobs");
    const q = query(jobsRef, orderBy("created_at", "desc"));
    const querySnapshot = await getDocs(q);

    const jobs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(jobs);
  } catch (err: any) {
    console.error("GetJobs error:", err);
    res.status(500).json({ message: "Server error fetching jobs", error: err.message });
  }
};

export const getJobById = async (req: Request, res: Response) => {
  try {
    const jobDocRef = doc(db, "jobs", req.params.id);
    const jobDoc = await getDoc(jobDocRef);
    if (!jobDoc.exists()) {
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

    const docRef = await addDoc(collection(db, "jobs"), newJob);
    
    // Notify Telegram
    notifyNewJob(newJob, docRef.id);

    res.status(201).json({ id: docRef.id, ...newJob });
  } catch (err: any) {
    console.error("CreateJob error:", err);
    res.status(500).json({ message: "Server error creating job", error: err.message });
  }
};
