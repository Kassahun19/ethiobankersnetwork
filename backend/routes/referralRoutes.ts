import express from "express";
import { getReferrals, createReferral } from "../controllers/referralController";
import { authenticate } from "../middleware/auth";

const router = express.Router();

router.get("/", authenticate, getReferrals);
router.post("/", authenticate, createReferral);

export default router;
