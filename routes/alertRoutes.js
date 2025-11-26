import express from "express";
import Alert from "../models/Alert.js";

const router = express.Router();

// 📌 GET ALL Alerts (Active + Resolved)
router.get("/", async (req, res) => {
  try {
    const alerts = await Alert.find().sort({ timestamp: -1 });
    res.json(alerts);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to load alerts",
      error: err.message
    });
  }
});
// 📌 GET Active Critical Alerts
router.get("/active", async (req, res) => {
  const alerts = await Alert.find({ resolved: false }).sort({ timestamp: -1 });
  res.json(alerts);
});

// 📌 GET Recent (Resolved) Alerts
router.get("/resolved", async (req, res) => {
  const alerts = await Alert.find({ resolved: true }).sort({ timestamp: -1 });
  res.json(alerts);
});

// 📌 Mark alert as resolved
router.put("/:id/resolve", async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { 
        resolved: true, 
        resolvedAt: new Date(),
        resolvedBy: "System"
      },
      { new: true }
    );

    res.json({ success: true, alert });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;