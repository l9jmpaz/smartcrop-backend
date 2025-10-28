// routes/adminRoutes.js
import express from "express";
import Alert from "../models/Alert.js";
import Crop from "../models/Crop.js";
import WeatherLog from "../models/WeatherLog.js";

const router = express.Router();

router.get("/dashboard-overview", async (req, res) => {
  try {
    const cropRecords = await Crop.countDocuments();
    const lastWeather = await WeatherLog.findOne().sort({ createdAt: -1 });
    const criticalAlerts = await Alert.countDocuments({ severity: "critical" });
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
    res.json({
      systemHealth: "All services operational",
      criticalAlerts,
      weatherLastSync: lastWeather ? lastWeather.createdAt : null,
      cropRecords
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/recent-alerts", async (req, res) => {
  try {
    const alerts = await Alert.find().sort({ createdAt: -1 }).limit(3);
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
