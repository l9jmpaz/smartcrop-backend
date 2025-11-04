// backend/models/Otp.js
import mongoose from "mongoose";

const OtpSchema = new mongoose.Schema({
  phone: { type: String, required: true },
  code: { type: String, required: true }, // store hashed if you want extra security
  attempts: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index in case DB supports it

export default mongoose.model("Otp", OtpSchema);