// models/Otp.js
import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    otpCode: { type: String, required: true }, // ✅ must match auth.js field
    expiresAt: { type: Date, required: true },
    lastSentAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("Otp", otpSchema);