// backend/routes/otp.js
import express from "express";
import { sendOtp, verifyOtp } from "../controllers/otpController.js";

const router = express.Router();

router.post("/send", sendOtp);    // { phone }
router.post("/verify", verifyOtp); // { otpId, phone, code }

export default router;