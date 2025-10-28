import mongoose from "mongoose";
import Farm from "../models/Farm.js";

export const getFarmByUser = async (req, res) => {
  console.log("📩 Incoming GET /api/farm/:userId =>", req.params.userId);
  try {
    const userId = req.params.userId;
    const farm = await Farm.findOne({ userId });
    console.log("🔍 Farm found:", farm);
    if (!farm) {
      return res.status(404).json({ success: false, message: "Farm not found" });
    }
    res.status(200).json({ success: true, farm });
  } catch (error) {
    console.error("❌ Error fetching farm:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Update farm info
export const updateFarm = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.params.userId); // convert to ObjectId
    const updatedFarm = await Farm.findOneAndUpdate({ userId }, req.body, { new: true });

    if (!updatedFarm) {
      return res.status(404).json({ success: false, message: "Farm not found" });
    }

    res.status(200).json({
      success: true,
      message: "Farm updated successfully",
      data: updatedFarm,
    });
  } catch (error) {
    console.error("Error updating farm:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};