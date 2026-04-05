import { Request, Response } from "express";
import { db } from "../config/firebase";
import { analyzeCV } from "../services/aiService";

export const uploadCV = async (req: any, res: Response) => {
  try {
    const userRef = db.collection("users").doc(req.user.id);
    // In a real app, we'd save the file path to Firestore
    await userRef.update({ cv_uploaded: true, cv_last_updated: new Date().toISOString() });
    res.json({ message: "CV uploaded successfully" });
  } catch (err: any) {
    console.error("UploadCV error:", err);
    res.status(500).json({ message: "Server error during CV upload", error: err.message });
  }
};

export const analyzeUserCV = async (req: any, res: Response) => {
  try {
    const userDocRef = db.collection("users").doc(req.user.id);
    const userDoc = await userDocRef.get();
    const userData = userDoc.data();
    
    // In a real app, we'd extract text from the uploaded PDF/Doc
    // For this demo, we'll use a placeholder text based on their profile
    const cvText = `Name: ${userData?.name}, Bank: ${userData?.bank}, Bio: ${userData?.bio || "No bio provided"}`;
    
    const analysis = await analyzeCV(cvText);
    res.json(analysis);
  } catch (err: any) {
    console.error("AnalyzeCV error:", err);
    res.status(500).json({ message: "Server error during CV analysis", error: err.message });
  }
};

export const verifyBankEmail = async (req: any, res: Response) => {
  try {
    const userRef = db.collection("users").doc(req.user.id);
    // In a real app, we'd send an email and wait for verification
    // For this demo, we'll just mark as verified
    await userRef.update({ is_verified: true });
    res.json({ message: "Verification email sent" });
  } catch (err: any) {
    console.error("VerifyBankEmail error:", err);
    res.status(500).json({ message: "Server error during verification", error: err.message });
  }
};

export const getUserStats = async (req: any, res: Response) => {
  try {
    const appsRef = db.collection("applications");
    const q = appsRef.where("user_id", "==", req.user.id);
    const querySnapshot = await q.get();

    const stats = {
      appliedJobs: querySnapshot.size,
      activeApplications: querySnapshot.docs.filter(doc => doc.data().status === "Pending").length,
      profileViews: Math.floor(Math.random() * 100), // Placeholder
      savedJobs: 0, // Placeholder
    };

    res.json(stats);
  } catch (err: any) {
    console.error("GetUserStats error:", err);
    res.status(500).json({ message: "Server error fetching stats", error: err.message });
  }
};

export const getRecentApplications = async (req: any, res: Response) => {
  try {
    const appsRef = db.collection("applications");
    const q = appsRef
      .where("user_id", "==", req.user.id)
      .orderBy("created_at", "desc")
      .limit(5);
    const querySnapshot = await q.get();

    const applications = await Promise.all(querySnapshot.docs.map(async (appDoc) => {
      const appData = appDoc.data();
      const jobDocRef = db.collection("jobs").doc(appData.job_id);
      const jobDoc = await jobDocRef.get();
      const jobData = jobDoc.exists ? jobDoc.data() : { title: "Unknown Job", bank: "Unknown Bank" };
      
      return {
        id: appDoc.id,
        jobTitle: jobData?.title,
        bankName: jobData?.bank,
        appliedDate: new Date(appData.created_at).toLocaleDateString(),
        status: appData.status,
      };
    }));

    res.json(applications);
  } catch (err: any) {
    console.error("GetRecentApplications error:", err);
    res.status(500).json({ message: "Server error fetching applications", error: err.message });
  }
};

export const updateProfile = async (req: any, res: Response) => {
  try {
    const userRef = db.collection("users").doc(req.user.id);
    await userRef.update(req.body);
    res.json({ message: "Profile updated successfully" });
  } catch (err: any) {
    console.error("UpdateProfile error:", err);
    res.status(500).json({ message: "Server error updating profile", error: err.message });
  }
};

export const getProfile = async (req: any, res: Response) => {
  try {
    const userDocRef = db.collection("users").doc(req.user.id);
    const userDoc = await userDocRef.get();
    if (!userDoc.exists) {
      return res.status(404).json({ message: "User not found" });
    }
    const userData = userDoc.data();
    delete (userData as any).password;
    res.json(userData);
  } catch (err: any) {
    console.error("GetProfile error:", err);
    res.status(500).json({ message: "Server error fetching profile", error: err.message });
  }
};
