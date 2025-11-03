// backend/routes/support.js
import express from "express";
import Support from "../models/Support.js";
import Notification from "../models/Notification.js"; // 🟢 add this
import User from "../models/User.js"; // 🟢 to display name in notification

const router = express.Router();

// 📨 Send message from user (used by Flutter app)
router.post("/", async (req, res) => {
  try {
    const { userId, message } = req.body;
    if (!userId || !message)
      return res
        .status(400)
        .json({ success: false, message: "Missing fields" });

    // 🟢 Save support message
    const supportMsg = await Support.create({
      userId,
      message,
      status: "unread",
      date: new Date(),
    });

    // 🧩 Find user details (to show name in notification)
    const user = await User.findById(userId);

    // 🟢 Create new notification for Admin Dashboard
    await Notification.create({
      title: "New Feedback Received",
      message: `New feedback submitted by ${user?.username || "a user"} from ${
        user?.barangay || "unknown barangay"
      }.`,
      type: "user",
    });

    res.json({ success: true, data: supportMsg });
  } catch (err) {
    console.error("❌ Error saving support message:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 🧾 Get all messages (used by Admin Dashboard)
router.get("/", async (req, res) => {
  try {
    const { status, q } = req.query;
    const query = {};

    if (status && status !== "all") query.status = status;
    if (q) query.message = { $regex: q, $options: "i" };

    const messages = await Support.find(query)
      .populate("userId", "username phone barangay")
      .sort({ date: -1 });

    res.json({ success: true, data: messages });
  } catch (err) {
    console.error("❌ Error fetching support messages:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 🟢 Mark as resolved
router.put("/:id", async (req, res) => {
  try {
    const updated = await Support.findByIdAndUpdate(
      req.params.id,
      { status: "resolved" },
      { new: true }
    );

    // 🟢 Create notification when admin marks feedback as resolved
    if (updated) {
      await Notification.create({
        title: "Feedback Resolved",
        message: `Feedback from user ${updated.userId} has been marked as resolved.`,
        type: "system",
      });
    }

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error("❌ Error updating support status:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;