import express from "express";
import { getJobs, getJobById, createJob } from "../controllers/jobController.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

router.get("/", getJobs);
router.get("/:id", getJobById);
router.post("/", authenticate, authorize(["admin", "employer"]), createJob);

export default router;
