import express from "express";
import { getUserStats, getRecentApplications, updateProfile, getProfile, analyzeUserCV, uploadCV, verifyBankEmail } from "../controllers/userController";
import { authenticate } from "../middleware/auth";
import multer from "multer";

const upload = multer({ dest: "uploads/" });
const router = express.Router();

router.get("/stats", authenticate, getUserStats);
router.get("/applications/recent", authenticate, getRecentApplications);
router.get("/profile", authenticate, getProfile);
router.put("/profile", authenticate, updateProfile);
router.post("/analyze-cv", authenticate, analyzeUserCV);
router.post("/upload-cv", authenticate, upload.single("cv"), uploadCV);
router.post("/verify-bank-email", authenticate, verifyBankEmail);

export default router;
