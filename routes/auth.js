import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import axios from "axios";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import Otp from "../models/Otp.js";

const router = express.Router();

/* ======================================================
   📞 Format phone number to correct PH format
====================================================== */
function formatPhone(phone) {
  if (!phone) return "";
  const trimmed = phone.toString().trim();

  // Semaphore requires 09XXXXXXXXX format
  if (trimmed.startsWith("+63")) return "0" + trimmed.substring(3);
  if (trimmed.startsWith("63")) return "0" + trimmed.substring(2);

  return trimmed;
}

/* ======================================================
   📩 Send OTP with Semaphore API
====================================================== */
async function sendSemaphoreOtp(phone, otpCode) {
  try {
    const formattedPhone = formatPhone(phone);

    console.log("📤 Sending OTP via Semaphore to:", formattedPhone);

    const response = await axios.post(
      "https://api.semaphore.co/api/v4/messages",
      {
        apikey: process.env.SEMAPHORE_API_KEY,
        number: formattedPhone,
        message: `Your SmartCrop OTP is ${otpCode}`,
        sendername: process.env.SEMAPHORE_SENDER_ID, // must be approved
      },
      { headers: { "Content-Type": "application/json" } }
    );

    console.log("✅ Semaphore SMS Response:", response.data);
    return true;
  } catch (err) {
    console.error("❌ Semaphore Error:", err.response?.data || err.message);
    return false;
  }
}

/* ======================================================
   👤 REGISTER USER
====================================================== */
router.post("/register", async (req, res) => {
  try {
    const { username, phone, password, barangay, email } = req.body;

    if (!username || !phone || !password || !barangay || !email)
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });

    const existingUser = await User.findOne({ $or: [{ phone }, { email }] });

    if (existingUser)
      return res.status(400).json({
        success: false,
        message:
          existingUser.phone === phone
            ? "Phone number already registered"
            : "Email already registered",
      });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username,
      phone,
      email,
      barangay,
      password: hashedPassword,
      role: "user",
      status: "Pending Verification",
    });

    await Notification.create({
      title: "New user registered",
      message: `Farmer ${username} registered from ${barangay}.`,
      type: "user",
    });

    res.status(201).json({
      success: true,
      message: "User created. Awaiting OTP verification.",
      userId: newUser._id,
    });
  } catch (err) {
    console.error("❌ Registration error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ======================================================
   🔁 RESEND OTP (REGISTRATION)
====================================================== */
router.post("/resend-otp", async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone)
      return res.status(400).json({ success: false, message: "Phone required" });

    const user = await User.findOne({ phone });
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    const otp = await Otp.create({
      userId: user._id,
      otpCode,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      lastSentAt: new Date(),
    });

    const sent = await sendSemaphoreOtp(phone, otpCode);
    if (!sent)
      return res.status(500).json({
        success: false,
        message: "Failed to send SMS via Semaphore",
      });

    res.json({
      success: true,
      message: "OTP sent successfully.",
      otpId: otp._id,
    });
  } catch (err) {
    console.error("❌ Resend OTP error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ======================================================
   🔐 VERIFY REGISTRATION OTP
====================================================== */
router.post("/verify-otp", async (req, res) => {
  try {
    const { otpId, otpCode, phone } = req.body;

    const otp = await Otp.findById(otpId);
    if (!otp)
      return res.status(404).json({ success: false, message: "OTP not found" });

    if (otp.expiresAt < new Date())
      return res.status(400).json({ success: false, message: "OTP expired" });

    if (otp.otpCode !== otpCode)
      return res.status(400).json({ success: false, message: "Invalid OTP" });

    await User.findOneAndUpdate({ phone }, { status: "Active" });

    await Otp.deleteOne({ _id: otpId });

    res.json({ success: true, message: "Account verified successfully!" });
  } catch (err) {
    console.error("❌ Verify OTP error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ======================================================
   🔑 SEND RESET PASSWORD OTP
====================================================== */
router.post("/send-reset-otp", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    const otp = await Otp.create({
      userId: user._id,
      otpCode,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    const sent = await sendSemaphoreOtp(user.phone, otpCode);
    if (!sent)
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP via Semaphore",
      });

    res.json({
      success: true,
      message: "Reset OTP sent successfully",
      otpId: otp._id,
    });
  } catch (err) {
    console.error("❌ Reset OTP error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ======================================================
   ✔ VERIFY RESET PASSWORD OTP
====================================================== */
router.post("/verify-reset-otp", async (req, res) => {
  try {
    const { otpId, otpCode, phone } = req.body;

    const otp = await Otp.findById(otpId);
    if (!otp)
      return res.status(404).json({ success: false, message: "OTP not found" });

    if (otp.expiresAt < new Date())
      return res.status(400).json({ success: false, message: "OTP expired" });

    if (otp.otpCode !== otpCode)
      return res.status(400).json({ success: false, message: "Invalid OTP" });

    await Otp.deleteOne({ _id: otpId });

    res.json({ success: true, message: "OTP verified" });
  } catch (err) {
    console.error("❌ verify-reset-otp error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ======================================================
   🔐 LOGIN
====================================================== */
router.post("/login", async (req, res) => {
  try {
    const { phone, username, password } = req.body;

    const user = await User.findOne({ $or: [{ phone }, { username }] });
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    if (user.status === "Pending Verification")
      return res.status(403).json({
        success: false,
        message: "Please verify your account first",
      });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res
        .status(401)
        .json({ success: false, message: "Incorrect password" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "smartcrop_secret",
      { expiresIn: "7d" }
    );

    res.json({ success: true, token, user });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;