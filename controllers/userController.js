import User from "../models/User.js";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

// ✅ Update user details (name/username and password)
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, phone, barangay } = req.body;

    const user = await User.findById(id);
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    if (username) user.username = username;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (barangay) user.barangay = barangay;

    await user.save();

    res.json({ success: true, message: "Profile updated successfully", user });
  } catch (err) {
    console.error("❌ Error updating user:", err);
    res.status(500).json({
      success: false,
      message: "Server error while updating user",
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
    // ✅ New line — saves relative URL path
user.profilePicture = `/uploads/${path.basename(req.file.path)}`;
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
// ======================================
// 🔐 CHANGE PASSWORD CONTROLLER
// ======================================
export const changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(id);
    if (!user)
      return res.status(404).json({ success: false, message: "User not found." });

    // Check old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch)
      return res.status(400).json({ success: false, message: "Incorrect old password." });

    // Set new password
    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;

    await user.save();

    res.json({ success: true, message: "Password changed successfully." });
  } catch (err) {
    console.error("❌ changePassword error:", err);
    res.status(500).json({
      success: false,
      message: "Server error while changing password.",
    });
  }
};