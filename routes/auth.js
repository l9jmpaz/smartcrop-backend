import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import Otp from "../models/Otp.js";
import { Resend } from "resend";

const router = express.Router();
const resend = new Resend(process.env.RESEND_API_KEY);

// 🧩 Helper: Send OTP Email
async function sendOtpEmail(email, otpCode) {
  try {
    console.log(`📤 Sending OTP via Resend to: ${email}`);
    const response = await resend.emails.send({
      from: "SmartCrop <noreply@resend.dev>",
      to: email,
      subject: "SmartCrop OTP Verification",
      html: `
        <div style="font-family: Arial; padding: 20px;">
          <h2 style="color: #2e7d32;">SmartCrop Verification</h2>
          <p>Hello! Your verification code is:</p>
          <h1 style="color: #2e7d32; font-size: 28px;">${otpCode}</h1>
          <p>This code will expire in 5 minutes. Please enter it to activate your account.</p>
        </div>
      `,
    });
    console.log("✅ OTP email sent successfully:", response?.id || "No ID");
    return true;
  } catch (err) {
    console.error("❌ Error sending OTP via Resend:", err.message);
    return false;
  }
}

// 🧾 REGISTER USER
router.post("/register", async (req, res) => {
  try {
    console.log("📥 Received registration:", req.body);
    const { username, phone, password, barangay, email } = req.body;

    if (!username || !phone || !password || !barangay || !email) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Phone number already registered" });
    }

    // Create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username,
      phone,
      password: hashedPassword,
      email,
      barangay,
      role: "user",
      status: "Pending Verification",
    });

    console.log("✅ User created:", newUser._id);

    // Notify admin
    await Notification.create({
      title: "New user registered",
      message: `A new farmer (${username}) has registered from ${barangay}.`,
      type: "user",
    });

    // Generate and store OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otp = await Otp.create({
      userId: newUser._id,
      otpCode,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      lastSentAt: new Date(),
    });

    // Send OTP Email
    const sent = await sendOtpEmail(email, otpCode);
    if (!sent) {
      return res.status(500).json({
        success: false,
        message: "User created, but OTP email failed to send. Please use resend option.",
      });
    }

    return res.status(201).json({
      success: true,
      message: "User registered successfully. OTP sent.",
      otpId: otp._id,
    });
  } catch (error) {
    console.error("❌ Registration error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during registration",
      error: error.message,
    });
  }
});

// ✅ RESEND OTP (with cooldown)
router.post("/resend-otp", async (req, res) => {
  try {
    const { phone, email } = req.body;
    if (!phone || !email) {
      return res.status(400).json({ success: false, message: "Missing phone or email" });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Check resend cooldown (50 seconds)
    const recentOtp = await Otp.findOne({ userId: user._id }).sort({ createdAt: -1 });
    if (recentOtp && recentOtp.lastSentAt && (Date.now() - recentOtp.lastSentAt.getTime()) < 50 * 1000) {
      return res.status(429).json({
        success: false,
        message: "Please wait 50 seconds before requesting another OTP.",
      });
    }

    // Generate new OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const newOtp = await Otp.create({
      userId: user._id,
      otpCode,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      lastSentAt: new Date(),
    });

    const sent = await sendOtpEmail(email, otpCode);
    if (!sent) {
      return res.status(500).json({ success: false, message: "Failed to send OTP email" });
    }

    res.json({
      success: true,
      message: "OTP resent successfully.",
      otpId: newOtp._id,
    });
  } catch (err) {
    console.error("❌ Resend OTP error:", err);
    res.status(500).json({ success: false, message: "Server error during OTP resend" });
  }
});

// 🔐 LOGIN
router.post("/login", async (req, res) => {
  try {
    const { phone, username, password } = req.body;
    if ((!phone && !username) || !password) {
      return res.status(400).json({ success: false, message: "Missing username/phone or password" });
    }

    const user = await User.findOne({ $or: [{ phone }, { username }] });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (user.status === "Pending Verification") {
      return res.status(403).json({
        success: false,
        message: "Please verify your account via OTP before logging in.",
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ success: false, message: "Invalid password" });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || "smartcrop_secret", {
      expiresIn: "7d",
    });

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
    res.status(500).json({ success: false, message: "Server error during login" });
  }
});

// ✅ VERIFY OTP
router.post("/verify-otp", async (req, res) => {
  try {
    const { otpId, otpCode, email } = req.body;
    if (!otpId || !otpCode || !email)
      return res.status(400).json({ success: false, message: "Missing OTP or email information" });

    const otpRecord = await Otp.findById(otpId);
    if (!otpRecord) return res.status(404).json({ success: false, message: "OTP record not found" });
    if (otpRecord.expiresAt < new Date()) {
      await Otp.deleteOne({ _id: otpId });
      return res.status(400).json({ success: false, message: "OTP expired, please request a new one" });
    }
    if (otpRecord.otpCode !== otpCode)
      return res.status(400).json({ success: false, message: "Invalid OTP code" });

    const user = await User.findOneAndUpdate({ phone }, { status: "Active" }, { new: true });
    await Otp.deleteOne({ _id: otpId });

    res.json({
      success: true,
      message: "Account verified successfully!",
      user: {
        id: user._id,
        username: user.username,
        phone: user.phone,
        barangay: user.barangay,
      },
    });
  } catch (err) {
    console.error("❌ OTP verify error:", err);
    res.status(500).json({ success: false, message: "Server error during OTP verification" });
  }
});

export default router;