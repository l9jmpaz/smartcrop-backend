import User from "../models/User.js";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

// ✅ Update user details (name/username and password)


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
// ✏ UPDATE USER DETAILS (username, email, phone, barangay)
// ====================================================
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    let { username, email, phone, barangay } = req.body;

    const user = await User.findById(id);
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    // 🔥 CLEAN PHONE NUMBER
    if (phone) {
      phone = phone.toString().replace(/\s+/g, ""); // remove spaces
      if (!phone.startsWith("+63")) {
        return res.status(400).json({
          success: false,
          message: "Phone number must start with +63"
        });
      }
      user.phone = phone;
    }

    if (username) user.username = username.trim();
    if (email) user.email = email.trim();
    if (barangay) user.barangay = barangay;

    await user.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      user
    });

  } catch (err) {
    console.error("❌ Error updating user:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

// ====================================================
// 🔐 CHANGE PASSWORD
// ====================================================
export const changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(id);
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch)
      return res.status(400).json({ success: false, message: "Incorrect old password" });

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;

    await user.save();
    res.json({ success: true, message: "Password updated successfully" });

  } catch (err) {
    console.error("❌ changePassword error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
