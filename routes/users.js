// ===========================
//  🚀 User Routes (FINAL FIX)
// ===========================
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import User from "../models/User.js";
import { uploadProfilePicture, updateUser } from "../controllers/userController.js";
import { activeFarmers } from "../utils/activeFarmers.js";
const router = express.Router();

// -------------------------------
// 🔧 Multer Storage
// -------------------------------
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), "uploads/profile_pictures");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = file.originalname.split(".").pop();
    cb(null, `${req.params.id}_${Date.now()}.${ext}`);
  },
});

const upload = multer({ storage });
router.patch("/:id/active", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        lastActive: new Date(),
        status: "Active"
      },
      { new: true }
    );

    if (!user)
      return res.status(404).json({ success: false, message: "user_not_found" });

    // 🔥 UPDATE METRIC TRACKER TOO
    activeFarmers[user._id.toString()] = Date.now();

    res.json({ success: true, user });
  } catch (err) {
    console.error("update active error:", err);
    res.status(500).json({ success: false, message: "server_error" });
  }
});
router.patch("/:id/inactive", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        status: "Inactive",
        lastActive: null
      },
      { new: true }
    );

    if (!user) return res.status(404).json({ success: false, message: "user_not_found" });

    res.json({ success: true, user });
  } catch (err) {
    console.error("inactive error:", err);
    res.status(500).json({ success: false, message: "server_error" });
  }
});
// -------------------------------
// 👤 GET ALL USERS
// -------------------------------
router.get("/", async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json({ success: true, data: users });
  } catch (err) {
    console.error("❌ Error fetching users:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// -------------------------------
// 👤 GET SINGLE USER
// -------------------------------
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    res.json({ success: true, data: user });
  } catch (err) {
    console.error("❌ Error getting user:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// -------------------------------
// ➕ ADD NEW USER
// -------------------------------
router.post("/", async (req, res) => {
  try {
    const { username, phone, barangay, status } = req.body;

    const newUser = new User({
      username,
      phone,
      barangay,
      status: status || "Inactive",
    });

    await newUser.save();
    res.status(201).json({ success: true, data: newUser });
  } catch (err) {
    console.error("❌ Error creating user:", err);
    res.status(500).json({ success: false, message: "Failed to create user" });
  }
});

// -------------------------------
// ✏ UPDATE USER INFO
// -------------------------------
router.put("/:id", updateUser);

// -------------------------------
// 🖼 UPLOAD PROFILE PICTURE
// -------------------------------
router.post("/upload/:id", upload.single("image"), uploadProfilePicture);

// -------------------------------
// 🗑 DELETE USER
// -------------------------------
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);

    if (!deleted)
      return res.status(404).json({ success: false, message: "User not found" });

    res.json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting user:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// -------------------------------
// 🟢 MARK USER ACTIVE
// -------------------------------

export default router;