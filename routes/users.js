import express from "express";
import User from "../models/User.js";

const router = express.Router();

// ✅ Get single user by ID
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, user });
  } catch (err) {
    console.error("❌ Error fetching user:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;