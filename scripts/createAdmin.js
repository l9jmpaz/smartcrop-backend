// scripts/createAdmin.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const existing = await User.findOne({ email: "admin@smartcrop.local" });
    if (existing) {
      console.log("Admin already exists");
      process.exit(0);
    }
    const hashed = await bcrypt.hash("admin", 10);
    const admin = await User.create({
      name: "Administrator",
      email: "admin@smartcrop.local",
      password: hashed,
      role: "admin"
    });
    console.log("Created admin:", admin.email);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seed();
