// backend/routes/support.js  
import express from "express";
import Support from "../models/Support.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";

const router = express.Router();

/* ============================================================
   1️⃣ SEND FEEDBACK MESSAGE (farmer → admin)
============================================================ */
router.post("/", async (req, res) => {
  try {
    const { userId, message } = req.body;

    if (!userId || !message)
      return res.status(400).json({ success: false, message: "Missing fields" });

    const supportMsg = await Support.create({
      userId,
      message,
      status: "unread",
      date: new Date(),
      adminReply: null,
    });

    const user = await User.findById(userId);

    await Notification.create({
      title: "New Feedback Received",
      message: `New feedback submitted by ${user?.username || "a user"} from ${
        user?.barangay || "unknown barangay"
      }.`,
      type: "user",
      userId: userId, // ✅ correct field
    });

    res.json({ success: true, data: supportMsg });
  } catch (err) {
    console.error("❌ Error saving support message:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ============================================================
   2️⃣ GET ALL FEEDBACK (admin dashboard)
============================================================ */
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

/* ============================================================
   3️⃣ MARK AS RESOLVED
============================================================ */
router.put("/:id", async (req, res) => {
  try {
    const updated = await Support.findByIdAndUpdate(
      req.params.id,
      { status: "resolved" },
      { new: true }
    );

    if (updated) {
      await Notification.create({
        title: "Feedback Resolved",
        message: `Feedback from user ${updated.userId} has been marked as resolved.`,
        type: "system",
        userId: updated.userId, // ✅ FIXED
      });
    }

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error("❌ Error updating support:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ============================================================
   4️⃣ ADMIN REPLY TO FEEDBACK
============================================================ */
router.put("/:id/reply", async (req, res) => {
  try {
    const { replyText } = req.body;

    if (!replyText || replyText.trim() === "")
      return res.status(400).json({
        success: false,
        message: "Reply cannot be empty",
      });

    const support = await Support.findById(req.params.id).populate(
      "userId",
      "username barangay"
    );

    if (!support)
      return res.status(404).json({ success: false, message: "Feedback not found" });

    support.adminReply = replyText;
    support.status = "resolved";
    support.repliedAt = new Date();
    await support.save();

    await Notification.create({
      title: "Admin Replied",
      message: `Admin replied to your feedback: "${replyText}"`,
      type: "reply",
      userId: support.userId?._id, // ✅ FIXED
    });

    res.json({
      success: true,
      message: "Reply sent successfully!",
      data: support,
    });
  } catch (err) {
    console.error("❌ Reply error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});
// 📌 Get all messages for a user (farmer chat)
router.get("/chat/:userId", async (req, res) => {
  try {
    const msgs = await Support.find({ userId: req.params.userId })
      .sort({ date: 1 });

    const formatted = msgs.map(m => ({
      sender: m.adminReply ? "admin" : "user",
      text: m.adminReply ? m.adminReply : m.message,
      date: m.date
    }));

    res.json({ success: true, messages: formatted });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});
export default router;
