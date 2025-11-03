import Notification from "../models/Notification.js";

// ✅ Get all notifications
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Create a new notification
export const createNotification = async (req, res) => {
  try {
    const { title, message, type } = req.body;
    const notification = await Notification.create({ title, message, type });
    res.json({ success: true, data: notification });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};