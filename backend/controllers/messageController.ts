import { Request, Response } from "express";
import { db } from "../config/firebase";

export const getConversations = async (req: any, res: Response) => {
  try {
    const messagesRef = db.collection("messages");
    const q = messagesRef
      .where("participants", "array-contains", req.user.id)
      .orderBy("created_at", "desc");
    const querySnapshot = await q.get();

    const conversationsMap = new Map();
    for (const messageDoc of querySnapshot.docs) {
      const messageData = messageDoc.data();
      const otherUserId = messageData.participants.find((id: string) => id !== req.user.id);
      
      if (!conversationsMap.has(otherUserId)) {
        const otherUserDocRef = db.collection("users").doc(otherUserId);
        const otherUserDoc = await otherUserDocRef.get();
        const otherUserData = otherUserDoc.exists ? otherUserDoc.data() : { name: "Unknown User" };
        
        conversationsMap.set(otherUserId, {
          id: otherUserId,
          name: otherUserData?.name,
          lastMessage: messageData.content,
          lastTime: new Date(messageData.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          unread: 0,
          online: Math.random() > 0.5, // Placeholder
        });
      }
    }

    res.json(Array.from(conversationsMap.values()));
  } catch (err: any) {
    console.error("GetConversations error:", err);
    res.status(500).json({ message: "Server error fetching conversations", error: err.message });
  }
};

export const getMessages = async (req: any, res: Response) => {
  try {
    const messagesRef = db.collection("messages");
    const q = messagesRef
      .where("participants", "array-contains", req.user.id)
      .orderBy("created_at", "asc");
    const querySnapshot = await q.get();

    const messages = querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as any))
      .filter(msg => msg.participants.includes(req.params.id));

    res.json(messages);
  } catch (err: any) {
    console.error("GetMessages error:", err);
    res.status(500).json({ message: "Server error fetching messages", error: err.message });
  }
};

export const sendMessage = async (req: any, res: Response) => {
  const { receiverId, content } = req.body;

  try {
    const newMessage = {
      sender_id: req.user.id,
      receiver_id: receiverId,
      content,
      participants: [req.user.id, receiverId],
      created_at: new Date().toISOString(),
    };

    const docRef = await db.collection("messages").add(newMessage);
    res.status(201).json({ id: docRef.id, ...newMessage });
  } catch (err: any) {
    console.error("SendMessage error:", err);
    res.status(500).json({ message: "Server error sending message", error: err.message });
  }
};
