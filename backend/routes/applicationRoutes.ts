import express from "express";
import { applyToJob, updateApplicationStatus } from "../controllers/applicationController";
import { authenticate, authorize } from "../middleware/auth";

const router = express.Router();

router.post("/", authenticate, applyToJob);
router.put("/:id", authenticate, authorize(["admin", "employer"]), updateApplicationStatus);

export default router;
