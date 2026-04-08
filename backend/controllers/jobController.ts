import { Request, Response } from "express";
import { db } from "../config/firebase";
import { notifyNewJob } from "../services/telegramBot";

export const getJobs = async (req: Request, res: Response) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM jobs ORDER BY created_at DESC",
    );
    const jobs = rows.map((job: any) => ({ id: job.id, ...job }));
    res.json(jobs);
  } catch (err: any) {
    console.error("GetJobs error:", err);
    res
      .status(500)
      .json({ message: "Server error fetching jobs", error: err.message });
  }
};

export const getJobById = async (req: Request, res: Response) => {
  try {
    const [rows] = await db.query("SELECT * FROM jobs WHERE id = ?", [
      req.params.id,
    ]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Job not found" });
    }
    const job = rows[0];
    res.json(job);
  } catch (err: any) {
    console.error("GetJobById error:", err);
    res
      .status(500)
      .json({
        message: "Server error fetching job details",
        error: err.message,
      });
  }
};

export const createJob = async (req: any, res: Response) => {
  const { title, description, bank, salary, location, type, requirements } =
    req.body;

  try {
    const created_at = new Date().toISOString();
    const [result] = await db.query(
      "INSERT INTO jobs (title, description, bank, salary, location, `type`, requirements, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        title,
        description,
        bank,
        salary || null,
        location,
        type,
        JSON.stringify(requirements || []),
        req.user.id,
        created_at,
      ],
    );

    const jobId = result.insertId;
    const newJob = {
      id: jobId,
      title,
      description,
      bank,
      salary,
      location,
      type,
      requirements,
      created_by: req.user.id,
      created_at,
    };

    // Notify Telegram
    notifyNewJob(newJob, jobId.toString());

    res.status(201).json(newJob);
  } catch (err: any) {
    console.error("CreateJob error:", err);
    res
      .status(500)
      .json({ message: "Server error creating job", error: err.message });
  }
};
