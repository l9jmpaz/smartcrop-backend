// backend/routes/support.js
import express from "express";
import Support from "../models/Support.js";

const router = express.Router();

// 📨 Send message from user (used by Flutter app)
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
    });

    res.json({ success: true, data: supportMsg });
  } catch (err) {
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
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
