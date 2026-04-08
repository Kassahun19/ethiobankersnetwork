import { Request, Response } from "express";
import bcryptModule from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../config/firebase";

const bcrypt = (bcryptModule as any).default || bcryptModule;

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
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (rows.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      `INSERT INTO users (name, email, phone, password, bank, role, is_verified, subscription_plan, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, 'free', ?)`,
      [
        name,
        email,
        phone,
        hashedPassword,
        bank,
        role || "user",
        new Date().toISOString(),
      ],
    );

    const user = {
      id: (result as any).insertId,
      name,
      email,
      phone,
      bank,
      role: role || "user",
      is_verified: false,
      subscription_plan: "free",
    };

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.status(201).json({ token, user });
  } catch (err: any) {
    console.error("[AUTH] Registration error:", err);
    res
      .status(500)
      .json({
        message: "Server error during registration",
        error: err.message,
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
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (rows.length === 0) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const userData = rows[0];
    console.log(`[AUTH] User found: ${userData.id}. Role: ${userData.role}`);

    const isMatch = await bcrypt.compare(password, userData.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const user = { id: userData.id, ...userData };
    delete user.password;

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    console.log(`[AUTH] User ${email} logged in successfully`);
    res.json({ token, user });
  } catch (err: any) {
    console.error("[AUTH] Login error:", err);
    res
      .status(500)
      .json({ message: "Server error during login", error: err.message });
  }
};

export const getMe = async (req: any, res: Response) => {
  try {
    const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [
      req.user.id,
    ]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = rows[0];
    delete user.password;

    res.json({ user });
  } catch (err: any) {
    console.error("GetMe error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
