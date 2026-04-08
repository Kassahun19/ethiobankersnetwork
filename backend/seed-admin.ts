import bcrypt from "bcryptjs";
import { db } from "./config/firebase"; // Now mysql

async function seedAdmin() {
  const name = "Admin";
  const email = "admin@ethiobankers.com";
  const password = "admin123";
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const [rows] = await db.query("SELECT id FROM users WHERE email = ?", [
      email,
    ]);
    if (rows.length > 0) {
      console.log("Admin already exists");
      return;
    }

    const [result] = await db.query(
      "INSERT INTO users (name, email, password, role, is_verified) VALUES (?, ?, ?, ?, 1)",
      [name, email, hashedPassword, "admin"],
    );
    console.log("Admin seeded. ID:", result.insertId);
    console.log("Login: email", email, "pass:", password);
  } catch (err) {
    console.error("Seed error:", err);
  }
}

seedAdmin().then(() => process.exit(0));
