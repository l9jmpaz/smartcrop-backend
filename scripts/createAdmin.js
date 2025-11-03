// createAdmin.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "./models/User.js"; // adjust if your model is elsewhere

dotenv.config();
await mongoose.connect(process.env.MONGO_URI);

const hashed = await bcrypt.hash("admin123", 10);

const admin = await User.create({
  username: "admin1",
  phone: "09999999999",
  password: hashed,
  barangay: "HQ",
  role: "admin",
  status: "Active",
});

console.log("✅ Admin created successfully:", admin.username);
process.exit();