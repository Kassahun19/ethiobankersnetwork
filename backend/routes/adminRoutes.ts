import express from "express";
import { getAllUsers, getAllReferrals } from "../controllers/adminController";
import { authenticate, authorize } from "../middleware/auth";

const router = express.Router();

// Only admins can access these routes
router.get("/users", authenticate, authorize(["admin"]), getAllUsers);
router.get("/referrals", authenticate, authorize(["admin"]), getAllReferrals);

export default router;
