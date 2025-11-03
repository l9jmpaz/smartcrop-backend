// ✅ User Routes (CRUD)
import express from "express";
import User from "../models/User.js";

const router = express.Router();

// ✅ Get all users
router.get("/", async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json({ success: true, data: users });
  } catch (err) {
    console.error("❌ Error fetching users:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ Get single user
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ Add new user (for Admin)
router.post("/", async (req, res) => {
  try {
    const { username, phone, barangay, status } = req.body;

    if (!username || !barangay) {
      return res.status(400).json({
        success: false,
        message: "Username and barangay are required",
      });
    }

    const newUser = new User({
      username,
      phone,
      barangay,
      status: status || "Active",
    });

    await newUser.save();
    res.status(201).json({ success: true, data: newUser });
  } catch (err) {
    console.error("❌ Error creating user:", err);
    res.status(500).json({ success: false, message: "Failed to create user" });
  }
});

// ✅ Update user info
router.put("/:id", async (req, res) => {
  try {
    const { username, phone, barangay, status } = req.body;

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { username, phone, barangay, status },
      { new: true }
    ).select("-password");

    if (!updated)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error("❌ Error updating user:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ Delete user
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    res.json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting user:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;