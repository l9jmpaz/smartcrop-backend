import mongoose from "mongoose";
import Farm from "../models/Farm.js";
import axios from "axios";

// =========================================================
// 1️⃣ GET ACTIVE FIELDS (NOT ARCHIVED)
// =========================================================
export const getFarmByUser = async (req, res) => {
  try {
    const farms = await Farm.find({
      userId: req.params.userId,
      archived: false
    }).sort({ createdAt: -1 });

    res.json({ success: true, farms });
  } catch (err) {
    console.error("getFarmByUser error:", err);
    res.status(500).json({ success: false, message: "server_error" });
  }
};

// =========================================================
// 2️⃣ ADD NEW FIELD
// =========================================================
export const addFarmField = async (req, res) => {
  try {
    const field = new Farm({
      ...req.body,
      archived: false,
    });

    await field.save();

    res.status(201).json({
      success: true,
      farm: field
    });
  } catch (err) {
    console.error("❌ Add field error:", err);
    res.status(500).json({ success: false, message: "add_field_failed" });
  }
};

// =========================================================
// 3️⃣ UPDATE FIELD
// =========================================================
export const updateFieldById = async (req, res) => {
  try {
    const updated = await Farm.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    if (!updated)
      return res.status(404).json({ success: false, message: "field_not_found" });

    res.json({ success: true, farm: updated });
  } catch (err) {
    console.error("updateField error:", err);
    res.status(500).json({ success: false, message: "server_error" });
  }
};

// =========================================================
// 4️⃣ ARCHIVE FIELD (Instead of DELETE)
// =========================================================

export const archiveField = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Delete all tasks belonging to this field
    await Task.deleteMany({ fieldId: id });

    // 2. Delete the field itself
    await Farm.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Field deleted and all related tasks removed",
    });
  } catch (err) {
    console.error("❌ archiveField error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to delete field",
    });
  }
};

// =========================================================
// 5️⃣ SAVE SELECTED CROP + AI RECOMMENDATIONS (CACHED)
// =========================================================
export const saveSelectedCrop = async (req, res) => {
  try {
    const { fieldId, crop, recommendations } = req.body;

    if (!fieldId || !crop) {
      return res.status(400).json({
        success: false,
        message: "missing_fieldId_or_crop"
      });
    }

    const farm = await Farm.findById(fieldId);
    if (!farm)
      return res.status(404).json({ success: false, message: "field_not_found" });

    farm.selectedCrop = crop;
    farm.aiRecommendations = recommendations || [];

    await farm.save();

    res.json({
      success: true,
      message: "crop_saved",
      crop,
      recommendations
    });
  } catch (err) {
    console.error("saveSelectedCrop error:", err);
    res.status(500).json({ success: false, message: "save_crop_failed" });
  }
};

// =========================================================
// 6️⃣ MARK FIELD HARVESTED → ARCHIVE
// =========================================================
export const markFieldHarvested = async (req, res) => {
  try {
    const farm = await Farm.findById(req.params.id);

    if (!farm)
      return res.status(404).json({ success: false, message: "field_not_found" });

    farm.archived = true;
    farm.completedAt = new Date();

    await farm.save();

    res.json({ success: true, message: "field_harvested", farm });
  } catch (err) {
    console.error("markFieldHarvested:", err);
    res.status(500).json({ success: false, message: "harvest_error" });
  }
};

// =========================================================
// 7️⃣ USER TASKS
// =========================================================

// GET TASKS BY USER
export const getTasksByUser = async (req, res) => {
  try {
    const farms = await Farm.find({ userId: req.params.userId });

    const all = farms.flatMap((f) => f.tasks);

    res.json({ success: true, tasks: all });
  } catch (err) {
    console.error("getTasks error:", err);
    res.status(500).json({ success: false, message: "load_tasks_failed" });
  }
};

// ADD TASK
export const addTask = async (req, res) => {
  try {
    const { fieldId, type, crop, date, fieldName, kilos } = req.body;

    const farm = await Farm.findById(fieldId);
    if (!farm)
      return res.status(404).json({ success: false, message: "field_not_found" });

    const newTask = {
      _id: new mongoose.Types.ObjectId(),
      type,
      crop,
      date,
      fieldName,
      completed: false,
      kilos: kilos || 0,
    };

    farm.tasks.push(newTask);
    await farm.save();

    res.json({ success: true, task: newTask });
  } catch (err) {
    console.error("addTask error:", err);
    res.status(500).json({ success: false, message: "add_task_failed" });
  }
};

// COMPLETE TASK
export const completeTask = async (req, res) => {
  try {
    const taskId = req.params.id;

    const farm = await Farm.findOne({ "tasks._id": taskId });
    if (!farm)
      return res.status(404).json({ success: false, message: "task_not_found" });

    const task = farm.tasks.find((t) => t._id.toString() === taskId);
    if (!task)
      return res.status(404).json({ success: false, message: "task_not_found" });

    task.completed = true;

    // If this is a harvest task → archive field
    if (task.type.toLowerCase() === "harvest") {
      farm.archived = true;
      farm.completedAt = new Date();
    }

    await farm.save();

    res.json({ success: true, message: "task_completed" });
  } catch (err) {
    console.error("completeTask error:", err);
    res.status(500).json({ success: false, message: "server_error" });
  }
};

// =========================================================
// 8️⃣ RETURN CACHED AI RECOMMENDATIONS FOR USER
// =========================================================
export const getCachedAIRecommendations = async (req, res) => {
  try {
    const userId = req.params.userId;

    const farms = await Farm.find({ userId, archived: false });

    const data = farms.map((f) => ({
      fieldName: f.fieldName,
      soilType: f.soilType,
      recommendations: (f.aiRecommendations || []).map((crop) => ({
        title: `${crop} - good_option`,
        color: "green",
        details: [
          `field_name:${f.fieldName}`,
          `soil_suitable:${f.soilType}`,
          `ideal_for:tanauan_city`,
          `suitability:90`,
          `seed_type:default`,
          `good_until:2025`
        ],
        warning: null
      })),
    }));

    // weather fallback
    const weather = {
      city: "Tanauan City",
      temp: 30,
      condition: "Clear"
    };

    let tip = "weather_stable";
    if (weather.temp > 33) tip = "high_temp_warning";
    if (weather.temp < 20) tip = "cool_temp_advice";

    res.json({
      success: true,
      weather,
      weatherTip: tip,
      data
    });
  } catch (err) {
    console.error("cachedAI error:", err);
    res.status(500).json({ success: false, message: "server_error" });
  }
}