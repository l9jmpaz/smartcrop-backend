import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import axios from "axios";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import Otp from "../models/Otp.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = express.Router();

/* ======================================================
   PHONE FORMAT (Semaphore requires 09XXXXXXXXX)
====================================================== */
function formatPhone(phone) {
  if (!phone) return "";
  phone = phone.toString().trim();

  // from +63XXXXXXXXXX → 09XXXXXXXXX
  if (phone.startsWith("+63")) return "0" + phone.substring(3);

  // from 63XXXXXXXXXX → 09XXXXXXXXX
  if (phone.startsWith("63")) return "0" + phone.substring(2);

  // Already correct
  return phone;
}

/* ======================================================
   SEND OTP WITH SEMAPHORE
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
        sendername: process.env.SEMAPHORE_SENDER_ID,
      },
      { headers: { "Content-Type": "application/json" } }
    );

    console.log("✅ Semaphore Response:", response.data);
    return true;
  } catch (err) {
    console.error("❌ Semaphore Error:", err.response?.data || err.message);
    return false;
  }
}
const certStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), "uploads/residency_certificates");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = file.originalname.split(".").pop();
    cb(null, `cert_${Date.now()}.${ext}`);
  },
});

const uploadCert = multer({ storage: certStorage });
/* ======================================================
   REGISTER USER
====================================================== */
router.post(
  "/register",
  uploadCert.single("barangayResidencyCert"), // <-- FILE FIELD NAME
  async (req, res) => {
    try {
      const { username, email, phone, password, barangay } = req.body;

      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "Barangay Residency Certificate is required" });
      }

      // Save path relative to server
      const certPath = `/uploads/residency_certificates/${req.file.filename}`;

      // Create user
      const user = new User({
        username,
        email,
        phone,
        password,
        barangay,
        barangayResidencyCert: certPath,
        status: "Inactive",
        isBanned: false,
      });

      await user.save();

      // Response must include userId for OTP screen
      res.status(201).json({
        success: true,
        message: "User registered successfully",
        userId: user._id, // <-- Flutter uses this
      });

    } catch (err) {
      console.error("❌ Registration error:", err);
      res.status(500).json({
        success: false,
        message: err.message || "Server error",
      });
    }
  }
);

/* ======================================================
   RESEND OTP FOR REGISTRATION
====================================================== */
router.post("/resend-otp", async (req, res) => {
  try {
    const { phone } = req.body;

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
        message: "Failed to send SMS",
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
   VERIFY REGISTRATION OTP
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

    res.json({ success: true, message: "Account verified!" });
  } catch (err) {
    console.error("❌ Verify error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ======================================================
   SEND RESET PASSWORD OTP
====================================================== */
router.post("/send-reset-otp", async (req, res) => {
  try {
    const { phone } = req.body;

    const user = await User.findOne({ phone });
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    const otp = await Otp.create({
      userId: user._id,
      otpCode,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    const sent = await sendSemaphoreOtp(phone, otpCode);
    if (!sent)
      return res.status(500).json({
        success: false,
        message: "Failed to send reset OTP",
      });

    res.json({
      success: true,
      otpId: otp._id,
      message: "Reset OTP sent",
    });
  } catch (err) {
    console.error("❌ Reset OTP error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ======================================================
   VERIFY RESET PASSWORD OTP
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
   LOGIN
====================================================== */
router.post("/login", async (req, res) => {
  try {
    const { phone, username, password } = req.body;

    const user = await User.findOne({ $or: [{ phone }, { username }] });
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    if (user.status === "Pending Verification")
      return res
        .status(403)
        .json({ success: false, message: "Please verify your account first" });

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

    res.json({
  success: true,
  token,
  user: {
    _id: user._id,
    username: user.username,
    email: user.email,
    phone: user.phone,
    barangay: user.barangay,
    role: user.role,
    status: user.status
  }
});
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
router.post("/change-password", async (req, res) => {
  try {
    const { phone, newPassword } = req.body;

    if (!phone || !newPassword)
      return res.status(400).json({
        success: false,
        message: "Missing phone or new password"
      });

    const user = await User.findOne({ phone });

    if (!user)
      return res.status(404).json({
        success: false,
        message: "User not found"
      });

    const hashed = await bcrypt.hash(newPassword, 10);

    await User.updateOne({ phone }, { password: hashed });

    res.json({
      success: true,
      message: "Password updated successfully"
    });

  } catch (err) {
    console.error("❌ change-password error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;