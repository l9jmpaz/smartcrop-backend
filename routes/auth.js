import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import axios from "axios"; // ✅ For Semaphore SMS API
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import Otp from "../models/Otp.js";

const router = express.Router();

/* ======================================================
   📱 Helper: Send OTP via Semaphore SMS
====================================================== */
async function sendOtpSms(phone, otpCode) {
  try {
    console.log(`📤 Sending OTP via Semaphore to: ${phone}`);

    const message = `[SmartCrop] Your verification code is ${otpCode}. This code will expire in 5 minutes.`;

    const response = await axios.post("https://api.semaphore.co/api/v4/messages", {
      apikey: process.env.SEMAPHORE_API_KEY,
      number: phone,
      message: message,
      sendername: process.env.SEMAPHORE_SENDER || "Semaphore",
    });

    if (response.data && response.data[0]?.status === "Queued") {
      console.log("✅ OTP SMS sent successfully via Semaphore.");
      return true;
    } else {
      console.error("⚠️ Failed to send OTP via Semaphore:", response.data);
      return false;
    }
  } catch (err) {
    console.error("❌ Error sending OTP via Semaphore:", err.message);
    return false;
  }
}

/* ======================================================
   🧾 REGISTER USER
====================================================== */
router.post("/register", async (req, res) => {
  try {
    console.log("📥 Received registration:", req.body);
    const { username, phone, password, barangay, email } = req.body;

    if (!username || !phone || !password || !barangay || !email) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const existingUser = await User.findOne({ $or: [{ phone }, { email }] });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message:
          existingUser.phone === phone
            ? "Phone number already registered"
            : "Email already registered",
      });
    }

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

    await Notification.create({
      title: "New user registered",
      message: `A new farmer (${username}) has registered from ${barangay}.`,
      type: "user",
    });

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    await Otp.create({
      userId: newUser._id,
      otpCode,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      lastSentAt: new Date(),
    });

    const sent = await sendOtpSms(phone, otpCode);
    if (!sent) {
      return res.status(500).json({
        success: false,
        message:
          "User created, but OTP SMS failed to send. Please use resend option.",
      });
    }

    res.status(201).json({
      success: true,
      message: "User registered successfully. OTP sent via SMS.",
    });
  } catch (error) {
    console.error("❌ Registration error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error during registration" });
  }
});

/* ======================================================
   🔁 RESEND OTP
====================================================== */
router.post("/resend-otp", async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone)
      return res.status(400).json({ success: false, message: "Missing phone" });

    const user = await User.findOne({ phone });
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    const recentOtp = await Otp.findOne({ userId: user._id }).sort({
      createdAt: -1,
    });

    if (
      recentOtp &&
      recentOtp.lastSentAt &&
      Date.now() - recentOtp.lastSentAt.getTime() < 50 * 1000
    ) {
      return res.status(429).json({
        success: false,
        message: "Please wait 50 seconds before requesting another OTP.",
      });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    await Otp.create({
      userId: user._id,
      otpCode,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      lastSentAt: new Date(),
    });

    const sent = await sendOtpSms(phone, otpCode);
    if (!sent)
      return res
        .status(500)
        .json({ success: false, message: "Failed to send OTP SMS" });

    res.json({ success: true, message: "OTP resent successfully via SMS." });
  } catch (err) {
    console.error("❌ Resend OTP error:", err);
    res.status(500).json({ success: false, message: "Server error during resend" });
  }
});

/* ======================================================
   🔐 LOGIN
====================================================== */
router.post("/login", async (req, res) => {
  try {
    const { phone, username, password } = req.body;

    if ((!phone && !username) || !password) {
      return res.status(400).json({
        success: false,
        message: "Missing username/phone or password",
      });
    }

    const user = await User.findOne({ $or: [{ phone }, { username }] });
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    if (user.status === "Pending Verification") {
      return res.status(403).json({
        success: false,
        message: "Please verify your account via OTP before logging in.",
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword)
      return res
        .status(401)
        .json({ success: false, message: "Invalid password" });

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
    res
      .status(500)
      .json({ success: false, message: "Server error during login" });
  }
});

/* ======================================================
   ✅ VERIFY OTP
====================================================== */
router.post("/verify-otp", async (req, res) => {
  try {
    const { phone, otpCode } = req.body;
    if (!phone || !otpCode)
      return res
        .status(400)
        .json({ success: false, message: "Missing phone or OTP" });

    const otpRecord = await Otp.findOne({ otpCode }).sort({ createdAt: -1 });
    if (!otpRecord)
      return res
        .status(404)
        .json({ success: false, message: "Invalid OTP code" });

    if (otpRecord.expiresAt < new Date()) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res
        .status(400)
        .json({ success: false, message: "OTP expired. Request new one." });
    }

    const user = await User.findOneAndUpdate(
      { phone },
      { status: "Active" },
      { new: true }
    );

    await Otp.deleteOne({ _id: otpRecord._id });

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
    console.error("❌ Verify OTP error:", err);
    res.status(500).json({ success: false, message: "Server error during verification" });
  }
});

export default router;