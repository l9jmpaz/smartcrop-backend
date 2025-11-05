import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import axios from "axios"; // ✅ for Semaphore API
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import Otp from "../models/Otp.js";

const router = express.Router();

/* ======================================================
   📞 Helper: Format PH Number for +63 format
====================================================== */
function formatPhone(phone) {
  if (!phone) return "";
  const trimmed = phone.toString().trim();
  if (trimmed.startsWith("+63")) return trimmed;
  if (trimmed.startsWith("0")) return "+63" + trimmed.substring(1);
  return trimmed;
}

/* ======================================================
   📱 Helper: Send OTP via Semaphore (with detailed logs)
====================================================== */
/* ======================================================
   📱 Helper: Send OTP via ClickSend (replaces Semaphore)
====================================================== */
/* ======================================================
   📱 Send OTP via ClickSend
====================================================== */
async function sendOtpSms(phone, otpCode) {
  try {
    const formattedPhone = phone.startsWith("+63")
      ? phone
      : phone.startsWith("0")
      ? "+63" + phone.slice(1)
      : phone;

    const message = `Your SmartCrop verification code is ${otpCode}.`;
    console.log("📤 Sending OTP via ClickSend to:", formattedPhone);

    const response = await axios.post(
      "https://rest.clicksend.com/v3/sms/send",
      {
        messages: [
          {
            source: "nodejs",
            body: message,
            to: formattedPhone,
            from: process.env.CLICKSEND_SENDER || "ClickSend",
          },
        ],
      },
      {
        auth: {
          username: process.env.CLICKSEND_USERNAME,
          password: process.env.CLICKSEND_API_KEY,
        },
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    console.log("✅ ClickSend Response:", response.data);
    return true;
  } catch (error) {
    console.error("❌ ClickSend Error:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    } else {
      console.error("Message:", error.message);
    }
    return false;
  }
}

router.post("/register", async (req, res) => {
  try {
    const { username, phone, password, barangay, email, firebaseUid } = req.body;

    if (!username || !phone || !password || !barangay || !email) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const existingUser = await User.findOne({ $or: [{ phone }, { email }] });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.phone === phone
          ? "Phone number already registered"
          : "Email already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ If Firebase verified the phone, mark as Active directly
    const newUser = await User.create({
      username,
      phone,
      email,
      barangay,
      password: hashedPassword,
      role: "user",
      status: firebaseUid ? "Active" : "Pending Verification",
      firebaseUid: firebaseUid || null,
    });

    // ✅ Create admin notification
    await Notification.create({
      title: "New user registered",
      message: `A new farmer (${username}) has registered from ${barangay}.`,
      type: "user",
    });

    res.status(201).json({
      success: true,
      message: firebaseUid
        ? "User registered successfully (Firebase verified)."
        : "User registered, pending verification.",
      userId: newUser._id,
    });

  } catch (error) {
    console.error("❌ Registration error:", error);
    res.status(500).json({ success: false, message: "Server error during registration" });
  }
});

/* ======================================================
   🔁 RESEND OTP
====================================================== */
router.post("/resend-otp", async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone)
      return res.status(400).json({ success: false, message: "Missing phone number" });

    const user = await User.findOne({ phone });
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    const recentOtp = await Otp.findOne({ userId: user._id }).sort({ createdAt: -1 });
    if (recentOtp && recentOtp.lastSentAt && Date.now() - recentOtp.lastSentAt.getTime() < 50 * 1000)
      return res.status(429).json({
        success: false,
        message: "Please wait 50 seconds before requesting another OTP.",
      });

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const newOtp = await Otp.create({
      userId: user._id,
      otpCode,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      lastSentAt: new Date(),
    });

    const sent = await sendOtpSms(phone, otpCode);
    if (!sent)
      return res.status(500).json({ success: false, message: "Failed to send OTP SMS" });

    res.json({ success: true, message: "OTP resent successfully.", otpId: newOtp._id });
  } catch (err) {
    console.error("❌ Resend OTP error:", err);
    res.status(500).json({ success: false, message: "Server error during OTP resend" });
  }
});

/* ======================================================
   🔐 LOGIN
====================================================== */
router.post("/login", async (req, res) => {
  try {
    const { phone, username, password } = req.body;
    if ((!phone && !username) || !password)
      return res.status(400).json({ success: false, message: "Missing username/phone or password" });

    const user = await User.findOne({ $or: [{ phone }, { username }] });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (user.status === "Pending Verification")
      return res.status(403).json({
        success: false,
        message: "Please verify your account via OTP before logging in.",
      });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword)
      return res.status(401).json({ success: false, message: "Invalid password" });

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
    res.status(500).json({ success: false, message: "Server error during login" });
  }
});

/* ======================================================
   ✅ VERIFY OTP
====================================================== */
router.post("/verify-otp", async (req, res) => {
  try {
    const { otpId, otpCode, phone } = req.body;
    if (!otpId || !otpCode || !phone)
      return res.status(400).json({ success: false, message: "Missing OTP or phone information" });

    const otpRecord = await Otp.findById(otpId);
    if (!otpRecord)
      return res.status(404).json({ success: false, message: "OTP record not found" });

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