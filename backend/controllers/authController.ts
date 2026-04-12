import { Request, Response } from "express";
import bcryptModule from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../config/firebase";
import { notifyAdminOfNewUser } from "../services/notificationService";

// Robust bcrypt import for different environments
const bcrypt = (bcryptModule as any).default || bcryptModule;

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_here";
if (!process.env.JWT_SECRET) {
  console.warn("[AUTH] JWT_SECRET environment variable is missing. Using default secret.");
} else {
  console.log("[AUTH] JWT_SECRET environment variable is present.");
}

export const register = async (req: Request, res: Response, next: any) => {
  let { name, email, phone, password, bank, role } = req.body;

  try {
    if (email) email = email.trim().toLowerCase();
    if (password) password = password.trim();
    if (name) name = name.trim();
    if (phone) phone = phone.trim();
    
    console.log(`[AUTH] Attempting registration for: ${email}`);
    if (!email || !password) {
      console.warn("[AUTH] Registration failed: Missing email or password");
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Check if user exists
    const usersRef = db.collection("users");
    console.log(`[AUTH] Querying users for email: ${email}`);
    const q = usersRef.where("email", "==", email);
    
    let querySnapshot;
    try {
      querySnapshot = await q.get();
      console.log(`[AUTH] Query successful. Empty: ${querySnapshot.empty}`);
    } catch (dbErr: any) {
      console.error("[AUTH] Firestore query failed during registration:", {
        message: dbErr.message,
        code: dbErr.code,
        stack: dbErr.stack
      });
      throw dbErr; // Re-throw to be caught by the outer catch
    }

    if (!querySnapshot.empty) {
      console.warn(`[AUTH] Registration failed: User ${email} already exists`);
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    console.log(`[AUTH] Hashing password for ${email}...`);
    const startHash = Date.now();
    const hashedPassword = await bcrypt.hash(password, 10);
    const endHash = Date.now();
    console.log(`[AUTH] Password hashed in ${endHash - startHash}ms`);

    // Create user
    const newUser = {
      name,
      email,
      phone,
      password: hashedPassword,
      bank,
      role: role === "admin" ? "user" : (role || "user"),
      is_verified: false,
      subscription_plan: "free",
      created_at: new Date().toISOString(),
      source: "website",
    };

    console.log("[AUTH] Adding user to Firestore...");
    const docRef = await usersRef.add(newUser);
    console.log(`[AUTH] User registered successfully with ID: ${docRef.id}`);
    
    const user: any = { id: docRef.id, ...newUser };
    delete user.password;

    // Notify Admin (Non-blocking)
    notifyAdminOfNewUser(user).catch(err => {
      console.error("Admin notification failed (non-blocking):", err);
    });

    // Create token
    const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({ token, user });
  } catch (err: any) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: any) => {
  let { email, password } = req.body;

  try {
    if (email) email = email.trim().toLowerCase();
    if (password) password = password.trim();
    
    console.log(`[AUTH] Attempting login for: ${email}`);
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const usersRef = db.collection("users");
    const normalizedEmail = email.toLowerCase().trim();
    console.log(`[AUTH] Fetching user for email: ${normalizedEmail}`);
    const q = usersRef.where("email", "==", normalizedEmail);
    
    let querySnapshot;
    try {
      querySnapshot = await q.get();
      console.log(`[AUTH] Query successful. Empty: ${querySnapshot.empty}`);
    } catch (dbErr: any) {
      console.error("[AUTH] Firestore query failed during login:", {
        message: dbErr.message,
        code: dbErr.code,
        stack: dbErr.stack
      });
      throw dbErr; // Re-throw to be caught by the outer catch
    }

    if (querySnapshot.empty) {
      console.warn(`[AUTH] Login failed: User ${email} not found in Firestore`);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    console.log(`[AUTH] User found: ${userDoc.id}. Role: ${userData.role}`);

    console.log("[AUTH] Comparing passwords...");
    const startCompare = Date.now();
    const isMatch = await bcrypt.compare(password, userData.password);
    const endCompare = Date.now();
    console.log(`[AUTH] Password comparison took ${endCompare - startCompare}ms. Match: ${isMatch}`);
    
    if (!isMatch) {
      console.warn(`[AUTH] Login failed: Password mismatch for ${email}`);
      // Log a small part of the hashes for debugging (safely)
      console.log(`[AUTH] Hash from DB starts with: ${userData.password.substring(0, 10)}...`);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const user: any = { id: userDoc.id, ...userData };
    delete user.password;

    const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: "7d" });

    console.log(`[AUTH] User ${email} logged in successfully`);
    res.json({ token, user });
  } catch (err: any) {
    next(err);
  }
};

export const getMe = async (req: any, res: Response, next: any) => {
  try {
    const userDocRef = db.collection("users").doc(req.user.id);
    const userDoc = await userDocRef.get();
    if (!userDoc.exists) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = { id: userDoc.id, ...userDoc.data() };
    delete (user as any).password;

    res.json({ user });
  } catch (err: any) {
    next(err);
  }
};
