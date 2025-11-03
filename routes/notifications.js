// backend/routes/notifications.js
import express from "express";
import Notification from "../models/Notification.js";

const router = express.Router();

// 📬 Get all notifications (with optional filters)
router.get("/", async (req, res) => {
  try {
    const { read } = req.query; // ?read=false for unread only
    const filter = read ? { read: read === "true" } : {};
    const notifications = await Notification.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: notifications });
  } catch (err) {
    console.error("❌ Error fetching notifications:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// 📩 Create a new notification
router.post("/", async (req, res) => {
  try {
    const { title, message, type, userId } = req.body;

    if (!title || !message) {
      return res.status(400).json({ success: false, message: "Missing title or message" });
    }

    const notification = await Notification.create({ title, message, type, userId });
    res.status(201).json({ success: true, data: notification });
  } catch (err) {
    console.error("❌ Error creating notification:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ Mark a notification as read
router.patch("/:id/read", async (req, res) => {
  try {
    const updated = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error("❌ Error marking as read:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ❌ Delete a notification
router.delete("/:id", async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Notification deleted" });
  } catch (err) {
    console.error("❌ Error deleting notification:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;