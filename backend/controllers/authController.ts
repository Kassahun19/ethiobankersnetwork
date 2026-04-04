import { Request, Response } from "express";
import * as bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../config/firebase";
import { collection, query, where, getDocs, addDoc, doc, getDoc } from "firebase/firestore";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_here";

export const register = async (req: Request, res: Response) => {
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
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    console.log("[AUTH] Checking if user exists in Firestore...");
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      console.warn(`[AUTH] Registration failed: User ${email} already exists`);
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    console.log("[AUTH] Hashing password...");
    const hashedPassword = await bcrypt.hash(password, 10);

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
    };

    console.log("[AUTH] Adding user to Firestore...");
    const docRef = await addDoc(usersRef, newUser);
    console.log(`[AUTH] User registered successfully with ID: ${docRef.id}`);
    
    const user: any = { id: docRef.id, ...newUser };
    delete user.password;

    // Create token
    const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({ token, user });
  } catch (err: any) {
    console.error("[AUTH] Registration error:", err);
    res.status(500).json({ 
      message: "Server error during registration", 
      error: err.message,
      code: err.code || "unknown"
    });
  }
};

export const login = async (req: Request, res: Response) => {
  let { email, password } = req.body;

  try {
    if (email) email = email.trim().toLowerCase();
    if (password) password = password.trim();
    
    console.log(`[AUTH] Attempting login for: ${email}`);
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    console.log("[AUTH] Fetching user from Firestore...");
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.warn(`[AUTH] Login failed: User ${email} not found`);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();

    console.log("[AUTH] Comparing passwords...");
    const isMatch = await bcrypt.compare(password, userData.password);
    if (!isMatch) {
      console.warn(`[AUTH] Login failed: Password mismatch for ${email}`);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const user: any = { id: userDoc.id, ...userData };
    delete user.password;

    const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: "7d" });

    console.log(`[AUTH] User ${email} logged in successfully`);
    res.json({ token, user });
  } catch (err: any) {
    console.error("[AUTH] Login error:", err);
    res.status(500).json({ 
      message: "Server error during login", 
      error: err.message,
      code: err.code || "unknown"
    });
  }
};

export const getMe = async (req: any, res: Response) => {
  try {
    const userDocRef = doc(db, "users", req.user.id);
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = { id: userDoc.id, ...userDoc.data() };
    delete (user as any).password;

    res.json({ user });
  } catch (err: any) {
    console.error("GetMe error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
