// backend/controllers/otpController.js
import Otp from "../models/Otp.js";
import crypto from "crypto";
import axios from "axios";

/**
 * Helper that actually sends SMS through provider.
 * This example demonstrates Textbelt (simple free testing) — replace with your provider.
 */
async function sendSms(phone, message) {
  // Example: Textbelt (https://textbelt.com)
  // Note: free key 'textbelt' is rate/credit limited. Get real key for production.
  try {
    const res = await axios.post("https://textbelt.com/text", {
      phone,
      message,
      key: "textbelt" // replace with your paid key in production
    }, { timeout: 10000 });

    return res.data;
  } catch (err) {
    console.error("SMS send error:", err?.response?.data || err.message);
    throw new Error("Failed to send SMS");
  }
}

function generateCode() {
  // secure 6-digit numeric code
  const num = crypto.randomInt(0, 1000000);
  return String(num).padStart(6, "0");
}

export const sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ success: false, message: "phone required" });

    // Optional: normalise phone format here (e.g. +63...)
    const code = generateCode();
    const ttlMinutes = 5;
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    // Save OTP record
    const otpDoc = await Otp.create({ phone, code, expiresAt });

    // send SMS (message should be short)
    const message = `Your SmartCrop verification code is: ${code}. It expires in ${ttlMinutes} minutes.`;
    const smsResult = await sendSms(phone, message);

    // respond with an id to identify OTP record for verification
    res.json({
      success: true,
      otpId: otpDoc._id,
      smsResult,
      message: "OTP sent"
    });
  } catch (err) {
    console.error("sendOtp error:", err);
    res.status(500).json({ success: false, message: "Server error while sending OTP" });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { otpId, phone, code } = req.body;
    if (!otpId || !phone || !code)
      return res.status(400).json({ success: false, message: "Missing fields" });

    const otpDoc = await Otp.findById(otpId);
    if (!otpDoc) return res.status(404).json({ success: false, message: "OTP not found" });
    if (otpDoc.phone !== phone) return res.status(400).json({ success: false, message: "Phone mismatch" });

    if (new Date() > otpDoc.expiresAt) {
      await Otp.findByIdAndDelete(otpId).catch(()=>{});
      return res.status(410).json({ success: false, message: "OTP expired" });
    }

    if (otpDoc.attempts >= 5) {
      await Otp.findByIdAndDelete(otpId).catch(()=>{});
      return res.status(429).json({ success: false, message: "Too many attempts" });
    }

    if (otpDoc.code !== code) {
      otpDoc.attempts = otpDoc.attempts + 1;
      await otpDoc.save();
      return res.status(400).json({ success: false, message: "Invalid code" });
    }

    // success: delete OTP and return success
    await Otp.findByIdAndDelete(otpId);
    // Optional: mark user verified in your users table here if you have user registration flow

    res.json({ success: true, message: "Phone verified" });
  } catch (err) {
    console.error("verifyOtp error:", err);
    res.status(500).json({ success: false, message: "Server error while verifying OTP" });
  }
};
