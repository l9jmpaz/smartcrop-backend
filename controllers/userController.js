import User from "../models/User.js";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

// ✅ Update user details (name/username and password)
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (username) user.username = username;

    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      user.password = hashed;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "User updated successfully.",
      user,
    });
  } catch (err) {
    console.error("❌ Error updating user:", err);
    res.status(500).json({
      success: false,
      message: "Server error while updating user.",
      error: err.message,
    });
  }
};

// ✅ Handle profile picture upload
export const uploadProfilePicture = async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded." });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // Delete old image if exists
    if (user.profilePicture && fs.existsSync(user.profilePicture)) {
      fs.unlinkSync(user.profilePicture);
    }

    // Save new path
    user.profilePicture = req.file.path;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile picture updated successfully.",
      imagePath: req.file.path,
    });
  } catch (err) {
    console.error("❌ Upload error:", err);
    res.status(500).json({
      success: false,
      message: "Server error while uploading image.",
      error: err.message,
    });
  }
};