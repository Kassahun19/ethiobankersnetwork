import express from "express";
import { getJobs, getJobById, createJob } from "../controllers/jobController";
import { authenticate, authorize } from "../middleware/auth";

const router = express.Router();

router.get("/", getJobs);
router.get("/:id", getJobById);
router.post("/", authenticate, authorize(["admin", "employer"]), createJob);

export default router;
