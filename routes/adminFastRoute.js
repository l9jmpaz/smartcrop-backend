import express from "express";
import User from "../models/User.js";
import Farm from "../models/Farm.js";

const router = express.Router();

// ------------------------------------------------------
// FAST FARMERS + FARMS COMBINED ENDPOINT
// ------------------------------------------------------
router.get("/fast/farmers", async (req, res) => {
  try {
    // 1. Get ALL users (farmers only)
    const users = await User.find({ role: "user" }).lean();

    // 2. Get ALL farms once
    const farms = await Farm.find({}).lean();

    // 3. Group farms by userId
    const farmsByUser = {};
    farms.forEach(farm => {
      const uid = farm.userId.toString();
      if (!farmsByUser[uid]) farmsByUser[uid] = [];
      farmsByUser[uid].push(farm);
    });

    // 4. Combine users + farms
    const result = users.map(user => ({
      ...user,
      farms: farmsByUser[user._id.toString()] || []
    }));

    res.json({ success: true, data: result });

  } catch (err) {
    console.error("FAST FETCH ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;