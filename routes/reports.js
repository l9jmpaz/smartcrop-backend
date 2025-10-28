// backend/routes/reports.js
import express from "express";
import Report from "../models/Report.js";
import CropLog from "../models/CropLog.js";
import WeatherLog from "../models/WeatherLog.js";

const router = express.Router();

/**
 * 📊 Overview: crop count, yield trend, avg rainfall
 */
router.get("/overview", async (req, res) => {
  try {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Crops count this month
    const cropCount = await CropReport.countDocuments({
      date: { $gte: thisMonth, $lt: nextMonth },
    });

    // Yield totals
    const thisMonthYield = await CropReport.aggregate([
      { $match: { date: { $gte: thisMonth, $lt: nextMonth } } },
      { $group: { _id: null, total: { $sum: "$yield" } } },
    ]);
    const lastMonthYield = await CropReport.aggregate([
      { $match: { date: { $gte: lastMonth, $lt: thisMonth } } },
      { $group: { _id: null, total: { $sum: "$yield" } } },
    ]);

    const thisYield = thisMonthYield[0]?.total || 0;
    const prevYield = lastMonthYield[0]?.total || 0;

    const yieldTrend =
      prevYield === 0 ? 0 : (((thisYield - prevYield) / prevYield) * 100).toFixed(1);

    // Avg rainfall this month
    const rainfallData = await WeatherReport.aggregate([
      { $match: { date: { $gte: thisMonth, $lt: nextMonth } } },
      { $group: { _id: null, avgRainfall: { $avg: "$rainfall" } } },
    ]);

    const avgRainfall = rainfallData[0]?.avgRainfall?.toFixed(1) || 0;

    res.json({
      cropCount,
      yieldTrend,
      avgRainfall,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch overview data" });
  }
});

/**
 * 📑 Recent reports
 */
router.get("/", async (req, res) => {
  try {
    const reports = await Report.find().sort({ date: -1 }).limit(3);
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch reports" });
  }
});

/**
 * 🌱 Crop reports
 */
router.get("/crops", async (req, res) => {
  try {
    const crops = await CropReport.find().sort({ date: -1 }).limit(5);
    res.json(crops);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch crop reports" });
  }
});

/**
 * 🌦 Weather reports
 */
router.get("/weather", async (req, res) => {
  try {
    const weather = await WeatherReport.find().sort({ date: -1 }).limit(5);
    res.json(weather);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch weather reports" });
  }
});

export default router;