import express from "express";
import { addYield, getYieldsByUser } from "../controllers/yieldController.js";
import Farm from "../models/Farm.js";

const router = express.Router();

/* ============================================================
   ORIGINAL ROUTES (DO NOT CHANGE)
============================================================ */
router.post("/", addYield);
router.get("/:userId", getYieldsByUser);

/* ============================================================
   NEW: ADMIN — GET GLOBAL YIELD TREND (LAST 12 MONTHS)
============================================================ */
router.get("/admin/trend", async (req, res) => {
  try {
    const farms = await Farm.find({ archived: true });

    const trend = {};

    farms.forEach((farm) => {
      farm.tasks
        ?.filter((t) => t.type === "Harvesting" && t.completed)
        ?.forEach((task) => {
          const month = new Date(task.date).toISOString().slice(0, 7); // YYYY-MM
          trend[month] = (trend[month] || 0) + (task.kilos || 0);
        });
    });

    const formatted = Object.keys(trend)
      .sort()
      .map((month) => ({
        date: month,
        yield: trend[month],
      }));

    res.json({ success: true, data: formatted });
  } catch (err) {
    console.error("Yield Trend Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ============================================================
   NEW: ADMIN — GET ALL YIELDS (OPTIONAL)
============================================================ */
router.get("/", async (req, res) => {
  try {
    const farms = await Farm.find();
    res.json({ success: true, data: farms });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;