import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import Otp from "../models/Otp.js"; // ✅ you'll create this model below
import nodemailer from "nodemailer"; // used for email-to-sms gateway or direct email OTP

const router = express.Router();

// Helper to send OTP via Email (or Email-to-SMS Gateway)
async function sendOtpToPhone(phone, code) {
  try {
    // Example using email-to-sms gateway (replace with real config)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Example: convert to email-to-sms address if Smart/Globe/DITO support it
    const to = `${phone}@sms.gateway.example.com`;

    await transporter.sendMail({
      from: `"SmartCrop OTP" <${process.env.EMAIL_USER}>`,
      to,
      subject: "Your SmartCrop Verification Code",
      text: `Your verification code is ${code}. It will expire in 5 minutes.`,
    });

    console.log(`📩 OTP sent to ${phone}: ${code}`);
  } catch (err) {
    console.error("❌ Failed to send OTP:", err.message);
  }
}

// 🧾 REGISTER USER + AUTO SEND OTP
router.post("/register", async (req, res) => {
  try {
    const { username, phone, password, barangay, email } = req.body;

    if (!username || !phone || !password || !barangay || !email) {
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

    // Create new user
    const newUser = await User.create({
      username,
      phone,
      password: hashedPassword,
      email,
      barangay,
      role: "user",
      status: "Pending Verification", // 👈 mark as pending until OTP verified
    });

    // 🟢 Create notification for Admin Dashboard
    await Notification.create({
      title: "New user registered",
      message: `A new farmer (${username}) has registered from ${barangay}.`,
      type: "user",
    });

    // 🔢 Generate OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP in DB with 5-minute expiry
    const otp = await Otp.create({
      phone,
      otpCode,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    // ✉️ Send OTP (via email-to-sms or API)
    await sendOtpToPhone(phone, otpCode);

    // ✅ Respond with OTP ID for verification screen
    res.status(201).json({
      success: true,
      message: "User registered successfully. OTP sent for verification.",
      otpId: otp._id,
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

    const user = await User.findOne({
      $or: [{ phone }, { username }],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 🟡 Prevent login if not verified
    if (user.status === "Pending Verification") {
      return res.status(403).json({
        success: false,
        message: "Please verify your account via OTP before logging in.",
      });
    }

    const validPassword =
      password === user.password ||
      (await bcrypt.compare(password, user.password));

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "smartcrop_secret",
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: `${user.role === "admin" ? "Admin" : "User"} login successful`,
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
// ✅ VERIFY OTP CODE
router.post("/verify-otp", async (req, res) => {
  try {
    const { otpId, otpCode, phone } = req.body;

    if (!otpId || !otpCode || !phone) {
      return res.status(400).json({
        success: false,
        message: "Missing OTP or phone information",
      });
    }

    // 1️⃣ Find OTP record
    const otpRecord = await Otp.findById(otpId);
    if (!otpRecord) {
      return res.status(404).json({
        success: false,
        message: "OTP record not found",
      });
    }

    // 2️⃣ Check if it expired
    if (otpRecord.expiresAt < new Date()) {
      await Otp.deleteOne({ _id: otpId });
      return res.status(400).json({
        success: false,
        message: "OTP expired, please request a new one",
      });
    }

    // 3️⃣ Compare code
    if (otpRecord.otpCode !== otpCode) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP code",
      });
    }

    // 4️⃣ Mark user as verified
    const user = await User.findOneAndUpdate(
      { phone },
      { status: "Active" },
      { new: true }
    );

    // 5️⃣ Delete OTP after verification
    await Otp.deleteOne({ _id: otpId });

    // 6️⃣ Done
    res.json({
      success: true,
      message: "Phone verified successfully!",
      user: {
        id: user._id,
        username: user.username,
        phone: user.phone,
        barangay: user.barangay,
      },
    });
  } catch (err) {
    console.error("❌ OTP verify error:", err);
    res.status(500).json({
      success: false,
      message: "Server error during OTP verification",
    });
  }
});

export default router;