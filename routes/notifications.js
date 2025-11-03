import express from "express";
import Notification from "../models/Notification.js";

const router = express.Router();

// 🟢 Get all notifications (Admin dashboard)
router.get("/", async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 });
    res.json({ success: true, data: notifications });
  } catch (err) {
    console.error("❌ Error fetching notifications:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// 🟢 Add new notification
router.post("/", async (req, res) => {
  try {
    const { title, message, type, userId } = req.body;
    const newNotif = new Notification({ title, message, type, userId });
    await newNotif.save();
    res.status(201).json({ success: true, data: newNotif });
  } catch (err) {
    console.error("❌ Error creating notification:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// 🟢 Mark as read
router.put("/:id/read", async (req, res) => {
  try {
    const notif = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    if (!notif) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: notif });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;