import Activity from "../models/Activity.js";
import mongoose from "mongoose";

// ✅ Add new activity
export const addActivity = async (req, res) => {
  try {
    const { userId } = req.params;
    const { activityType, fieldName, date, notes, image } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    const newActivity = new Activity({
      userId,
      activityType,
      fieldName,
      date,
      notes,
      image,
    });

    await newActivity.save();
    console.log("✅ New activity logged:", newActivity);

    res.status(200).json({
      success: true,
      message: "Activity logged successfully",
      activity: newActivity,
    });
  } catch (error) {
    console.error("❌ Error adding activity:", error);
    res.status(500).json({
      success: false,
      message: "Error logging activity",
      error: error.message,
    });
  }
};

// ✅ Fetch all activities for a user
export const getActivities = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    const activities = await Activity.find({ userId }).sort({ date: -1 });

    res.status(200).json(activities);
  } catch (error) {
    console.error("❌ Error fetching activities:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching activities",
      error: error.message,
    });
  }
};