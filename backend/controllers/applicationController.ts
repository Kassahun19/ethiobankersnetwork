import { Request, Response } from "express";
import { db } from "../config/firebase";

export const applyToJob = async (req: any, res: Response) => {
  const { jobId } = req.body;

  try {
    // Check if already applied
    const [rows] = await db.query(
      "SELECT id FROM applications WHERE user_id = ? AND job_id = ?",
      [req.user.id, jobId],
    );
    if (rows.length > 0) {
      return res
        .status(400)
        .json({ message: "You have already applied for this job" });
    }

    const newApplication = {
      user_id: req.user.id,
      job_id: jobId,
      status: "Pending",
      created_at: new Date().toISOString(),
    };

    const [result] = await db.query(
      "INSERT INTO applications (user_id, job_id, status, created_at) VALUES (?, ?, ?, ?)",
      [req.user.id, jobId, "Pending", newApplication.created_at],
    );

    res.status(201).json({ id: result.insertId, ...newApplication });
  } catch (err: any) {
    console.error("ApplyToJob error:", err);
    res
      .status(500)
      .json({ message: "Server error during application", error: err.message });
  }
};

export const updateApplicationStatus = async (req: any, res: Response) => {
  const { status } = req.body;

  try {
    await db.query("UPDATE applications SET status = ? WHERE id = ?", [
      status,
      req.params.id,
    ]);
    res.json({ message: "Application status updated" });
  } catch (err: any) {
    console.error("UpdateStatus error:", err);
    res
      .status(500)
      .json({ message: "Server error updating status", error: err.message });
  }
};
