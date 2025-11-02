// routes/supportRoutes.js
import express from "express";
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { userId, message } = req.body;

    if (!userId || !message) {
      return res.status(400).json({ success: false, error: "Missing data" });
    }

    // 🧠 Here you could save to MongoDB later, but for now we’ll just log it.
    console.log(`📩 Support message from ${userId}: ${message}`);

    // Return success
    return res.json({ success: true, msg: "Message received" });
  } catch (err) {
    console.error("❌ Support route error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

export default router;