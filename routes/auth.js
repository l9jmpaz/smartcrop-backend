import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
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

    // Check if phone already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Phone number already registered",
      });
    }

    // 🔐 Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username,
      phone,
      password: hashedPassword,
      barangay,
      role: "user", // default for normal users
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


// 🔐 LOGIN (User or Admin)
router.post("/login", async (req, res) => {
  try {
    const { phone, username, password } = req.body;

    if ((!phone && !username) || !password) {
      return res.status(400).json({
        success: false,
        message: "Missing username/phone or password",
      });
    }

    // ✅ Find user by username or phone
    const user = await User.findOne({
      $or: [{ phone }, { username }],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ✅ Compare password
    const validPassword =
      password === user.password ||
      (await bcrypt.compare(password, user.password));

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    // ✅ Create JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "smartcrop_secret",
      { expiresIn: "7d" }
    );

    // ✅ Differentiate Admin vs User
    if (user.role === "admin") {
      return res.json({
        success: true,
        message: "Admin login successful",
        token,
        user: {
          _id: user._id,
          username: user.username,
          role: user.role,
        },
      });
    }

    // ✅ Normal user login
    res.json({
      success: true,
      message: "User login successful",
      token,
      user: {
        _id: user._id,
        username: user.username,
        phone: user.phone,
        barangay: user.barangay,
        role: user.role,
      },
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