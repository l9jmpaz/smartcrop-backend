// routes/profile.js
import express from "express";
import multer from "multer";
import cloudinary from "../utils/cloudinary.js";
import User from "../models/User.js";
import { protect } from "../middleware/authMiddleware.js";
import fs from "fs";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/upload", protect, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file" });
    const result = await cloudinary.uploader.upload(req.file.path);
    fs.unlinkSync(req.file.path);
    const user = await User.findByIdAndUpdate(req.user._id, { profilePic: result.secure_url }, { new: true });
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
