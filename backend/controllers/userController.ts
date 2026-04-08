import { Request, Response } from "express";
import { db } from "../config/firebase";
import { analyzeCV } from "../services/aiService";

export const uploadCV = async (req: any, res: Response) => {
  try {
    await db.query(
      "UPDATE users SET cv_uploaded = 1, cv_last_updated = NOW() WHERE id = ?",
      [req.user.id],
    );
    res.json({ message: "CV uploaded successfully" });
  } catch (err: any) {
    console.error("UploadCV error:", err);
    res
      .status(500)
      .json({ message: "Server error during CV upload", error: err.message });
  }
};

export const analyzeUserCV = async (req: any, res: Response) => {
  try {
    const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [
      req.user.id,
    ]);
    const userData = rows[0] || {};

    // In a real app, we'd extract text from the uploaded PDF/Doc
    // For this demo, we'll use a placeholder text based on their profile
    const cvText = `Name: ${userData?.name}, Bank: ${userData?.bank}, Bio: ${userData?.bio || "No bio provided"}`;

    const analysis = await analyzeCV(cvText);
    res.json(analysis);
  } catch (err: any) {
    console.error("AnalyzeCV error:", err);
    res
      .status(500)
      .json({ message: "Server error during CV analysis", error: err.message });
  }
};

export const verifyBankEmail = async (req: any, res: Response) => {
  try {
    await db.query("UPDATE users SET is_verified = 1 WHERE id = ?", [
      req.user.id,
    ]);
    res.json({ message: "Verification email sent" });
  } catch (err: any) {
    console.error("VerifyBankEmail error:", err);
    res.status(500).json({
      message: "Server error during verification",
      error: err.message,
    });
  }
};

export const getUserStats = async (req: any, res: Response) => {
  try {
    const [rows] = await db.query(
      "SELECT COUNT(*) as count FROM applications WHERE user_id = ?",
      [req.user.id],
    );
    const [appsStatus] = await db.query(
      "SELECT COUNT(*) as active FROM applications WHERE user_id = ? AND status = ?",
      [req.user.id, "Pending"],
    );

    const stats = {
      appliedJobs: rows[0].count || 0,
      activeApplications: appsStatus[0].active || 0,
      profileViews: Math.floor(Math.random() * 100),
      savedJobs: 0,
    };

    res.json(stats);
  } catch (err: any) {
    console.error("GetUserStats error:", err);
    res
      .status(500)
      .json({ message: "Server error fetching stats", error: err.message });
  }
};

export const getRecentApplications = async (req: any, res: Response) => {
  try {
    const [rows] = await db.query(
      `
      SELECT a.id, a.status, a.created_at, j.title as jobTitle, j.bank as bankName 
      FROM applications a 
      LEFT JOIN jobs j ON a.job_id = j.id 
      WHERE a.user_id = ? 
      ORDER BY a.created_at DESC 
      LIMIT 5
    `,
      [req.user.id],
    );

    const applications = rows.map((app: any) => ({
      id: app.id,
      jobTitle: app.jobTitle || "Unknown Job",
      bankName: app.bankName || "Unknown Bank",
      appliedDate: new Date(app.created_at).toLocaleDateString(),
      status: app.status,
    }));

    res.json(applications);
  } catch (err: any) {
    console.error("GetRecentApplications error:", err);
    res.status(500).json({
      message: "Server error fetching applications",
      error: err.message,
    });
  }
};

export const updateProfile = async (req: any, res: Response) => {
  try {
    const fields = req.body;
    const setClause = Object.keys(fields)
      .map((key) => `\`${key}\` = ?`)
      .join(", ");
    const values = Object.values(fields).concat([req.user.id]);
    await db.query(`UPDATE users SET ${setClause} WHERE id = ?`, values);
    res.json({ message: "Profile updated successfully" });
  } catch (err: any) {
    console.error("UpdateProfile error:", err);
    res
      .status(500)
      .json({ message: "Server error updating profile", error: err.message });
  }
};

export const getProfile = async (req: any, res: Response) => {
  try {
    const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [
      req.user.id,
    ]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    const userData = rows[0];
    delete userData.password;
    res.json(userData);
  } catch (err: any) {
    console.error("GetProfile error:", err);
    res
      .status(500)
      .json({ message: "Server error fetching profile", error: err.message });
  }
};
