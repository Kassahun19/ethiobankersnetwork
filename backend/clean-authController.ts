import { Request, Response } from "express";
import bcryptModule from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../config/firebase";

const bcrypt = (bcryptModule as any).default || bcryptModule;
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_here";

export const register = async (req: Request, res: Response) => {
  const { name, email, phone, password, bank, role } = req.body;
  try {
    const trimmedEmail = email.trim().toLowerCase();
    const hashedPassword = await bcrypt.hash(password.trim(), 10);

    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [
      trimmedEmail,
    ]);
    if (rows.length > 0)
      return res.status(400).json({ message: "User already exists" });

    const [result] = await db.query(
      `INSERT INTO users (name, email, phone, password, bank, role, is_verified, subscription_plan, created_at) VALUES (?, ?, ?, ?, ?, ?, 0, 'free', ?)`,
      [
        name.trim(),
        trimmedEmail,
        phone?.trim(),
        hashedPassword,
        bank,
        role || "user",
        new Date().toISOString(),
      ],
    );

    const user = {
      id: result.insertId,
      name: name.trim(),
      email: trimmedEmail,
      phone: phone?.trim(),
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
  const { email, password } = req.body;
  try {
    const trimmedEmail = email.trim().toLowerCase();

    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [
      trimmedEmail,
    ]);
    if (rows.length === 0)
      return res.status(400).json({ message: "Invalid credentials" });

    const userData = rows[0];
    const isMatch = await bcrypt.compare(password.trim(), userData.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const user = { id: userData.id, ...userData };
    delete user.password;

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" },
    );
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
    if (rows.length === 0)
      return res.status(404).json({ message: "User not found" });

    const user = rows[0];
    delete user.password;
    res.json({ user });
  } catch (err: any) {
    console.error("GetMe error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
