import express from "express";
import { getConversations, getMessages, sendMessage } from "../controllers/messageController";
import { authenticate } from "../middleware/auth";

const router = express.Router();

router.get("/conversations", authenticate, getConversations);
router.get("/:id", authenticate, getMessages);
router.post("/send", authenticate, sendMessage);

export default router;
