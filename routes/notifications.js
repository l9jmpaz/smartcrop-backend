// backend/routes/notifications.js
import express from "express";
import Notification from "../models/Notification.js";

const router = express.Router();

// 📬 Get all notifications
router.get("/", async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    console.error("❌ Error fetching notifications:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// 📩 Create a notification
router.post("/", async (req, res) => {
  try {
    const { title, message, type } = req.body;
    const notification = await Notification.create({ title, message, type });
    res.status(201).json(notification);
  } catch (err) {
    console.error("❌ Error creating notification:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Mark as read
router.patch("/:id/read", async (req, res) => {
  try {
    const updated = await Notification.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;