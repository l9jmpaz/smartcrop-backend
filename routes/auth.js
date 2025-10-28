import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

const router = express.Router();


// 🧾 REGISTER USER
router.post("/register", async (req, res) => {
  try {
    const { username, phone, password, barangay } = req.body;

    if (!username || !phone || !password || !barangay) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Check if phone number already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Phone number already registered",
      });
    }

    // 🔐 Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username,
      phone,
      password: hashedPassword,
      barangay,
      role: "user",
      status: "Active",
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: newUser,
    });
  } catch (error) {
    console.error("❌ Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during registration",
    });
  }
});


// 🔐 LOGIN USER
router.post("/login", async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Missing phone or password",
      });
    }

    // Find user by phone
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Compare password (hash check)
    // For testing only — allow plain text match
const validPassword = password === user.password || await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    // ✅ Success: return user info (no password)
    const safeUser = {
      _id: user._id,
      username: user.username,
      phone: user.phone,
      barangay: user.barangay,
      role: user.role,
    };

    res.json({
      success: true,
      message: "Login successful",
      user: safeUser,
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
});

export default router;
