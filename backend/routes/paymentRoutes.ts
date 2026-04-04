import express from "express";
import { subscribe } from "../controllers/paymentController";
import { authenticate } from "../middleware/auth";

const router = express.Router();

router.post("/subscribe", authenticate, subscribe);

export default router;
