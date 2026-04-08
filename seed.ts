import { db } from "./backend/config/firebase";
import * as bcrypt from "bcryptjs";

const jobs = [
  {
    title: "Senior Relationship Manager",
    bank: "Commercial Bank of Ethiopia (CBE)",
    description: "We are looking for an experienced Relationship Manager to handle our corporate clients. You will be responsible for maintaining strong relationships and identifying new business opportunities.",
    salary: "35,000 - 45,000 ETB",
    location: "Addis Ababa",
    type: "Full-time",
    requirements: ["5+ years in corporate banking", "MBA preferred", "Strong negotiation skills"],
    created_by: "system",
    created_at: new Date().toISOString(),
  },
  {
    title: "IT Security Specialist",
    bank: "Awash Bank",
    description: "Join our cybersecurity team to protect our digital infrastructure. You will be responsible for monitoring systems, conducting audits, and implementing security protocols.",
    salary: "40,000 - 55,000 ETB",
    location: "Addis Ababa",
    type: "Full-time",
    requirements: ["BSc in Computer Science", "CISSP or CISM certification", "Experience with banking security"],
    created_by: "system",
    created_at: new Date().toISOString(),
  },
  {
    title: "Branch Manager",
    bank: "Dashen Bank",
    description: "Lead one of our busy branches in Bahir Dar. You will oversee daily operations, manage staff, and ensure excellent customer service.",
    salary: "30,000 - 40,000 ETB",
    location: "Bahir Dar",
    type: "Full-time",
    requirements: ["7+ years in branch operations", "Proven leadership skills", "Local language proficiency"],
    created_by: "system",
    created_at: new Date().toISOString(),
  },
  {
    title: "Junior Accountant",
    bank: "Abyssinia Bank",
    description: "Great entry-level opportunity for a fresh graduate. You will assist in financial reporting, reconciliation, and audit preparation.",
    salary: "15,000 - 20,000 ETB",
    location: "Addis Ababa",
    type: "Full-time",
    requirements: ["BSc in Accounting", "0-1 year experience", "Attention to detail"],
    created_by: "system",
    created_at: new Date().toISOString(),
  },
  {
    title: "Customer Service Officer",
    bank: "Bunna Bank",
    description: "Join our growing team at Bunna Bank. You will be the face of our branch, assisting customers with their daily banking needs and promoting our financial products.",
    salary: "18,000 - 25,000 ETB",
    location: "Addis Ababa",
    type: "Full-time",
    requirements: ["BSc in Management or related field", "Excellent communication skills", "Customer-centric mindset"],
    created_by: "system",
    created_at: new Date().toISOString(),
  },
];

async function seed() {
  try {
    // Add jobs
    const jobsRef = db.collection("jobs");
    for (const job of jobs) {
      try {
        await jobsRef.add(job);
        console.log(`Added job: ${job.title}`);
      } catch (e: any) {
        console.warn(`Skipping job ${job.title} due to permissions: ${e.message}`);
      }
    }

    // Add admin user
    const usersRef = db.collection("users");
    const adminEmail = "kmulatu21@gmail.com";
    const querySnapshot = await usersRef.where("email", "==", adminEmail).get();

    if (querySnapshot.empty) {
      const hashedPassword = await bcrypt.hash("admin", 10);
      const adminUser = {
        name: "Admin",
        email: adminEmail,
        password: hashedPassword,
        bank: "System",
        role: "admin",
        is_verified: true,
        subscription_plan: "premium",
        created_at: new Date().toISOString(),
      };
      await usersRef.add(adminUser);
      console.log("Admin user seeded successfully!");
    } else {
      console.log("Admin user already exists.");
    }

    console.log("Seeding completed!");
  } catch (err: any) {
    console.error("Seeding failed:", err);
  }
}

seed();
