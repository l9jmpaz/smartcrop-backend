import mongoose from "mongoose";
import Farm from "../models/Farm.js";
import axios from "axios";
import Task from "../models/Task.js";

// =========================================================
// GLOBAL POPULATE SETTINGS (SAFE)
// =========================================================
const FARM_POPULATE = { path: "userId", select: "username barangay" };

// =========================================================
// 1️⃣ GET ACTIVE FIELDS (NOT ARCHIVED)
// =========================================================
export const getFarmByUser = async (req, res) => {
  try {
    const farms = await Farm.find({
      userId: req.params.userId,
      archived: false,
    })
      .populate(FARM_POPULATE)
      .sort({ createdAt: -1 });

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

    const populated = await Farm.findById(field._id).populate(FARM_POPULATE);

    res.status(201).json({
      success: true,
      farm: populated,
    });
  } catch (err) {
    console.error("❌ Add field error:", err);
    res.status(500).json({ success: false, message: "add_field_failed" });
  }
};

// =========================================================
// 3️⃣ FIELD DETAILS
// =========================================================
export const getFieldDetails = async (req, res) => {
  try {
    const { fieldId } = req.params;

    const farm = await Farm.findById(fieldId).populate(FARM_POPULATE);

    if (!farm) {
      return res.status(404).json({ success: false, message: "Field not found" });
    }

    res.json({
      success: true,
      field: farm,
      tasks: farm.tasks || [],
    });
  } catch (err) {
    console.error("❌ Field details error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// =========================================================
// =========================================================
export const updateFieldById = async (req, res) => {
  try {
    const updated = await Farm.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    ).populate(FARM_POPULATE);

    if (!updated)
      return res.status(404).json({ success: false, message: "field_not_found" });

    res.json({ success: true, farm: updated });
  } catch (err) {
    console.error("updateField error:", err);
    res.status(500).json({ success: false, message: "server_error" });
  }
};

// =========================================================
// 5️⃣ ARCHIVE FIELD (DELETE FIELD + TASKS)
// =========================================================
export const archiveField = async (req, res) => {
  try {
    const { id } = req.params;

    await Task.deleteMany({ fieldId: id });
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
// 6️⃣ SAVE SELECTED CROP + AI RECOMMENDATIONS
// =========================================================
export const saveSelectedCrop = async (req, res) => {
  try {
    const { fieldId, crop, recommendations } = req.body;

    if (!fieldId || !crop)
      return res.status(400).json({ success: false, message: "missing_fieldId_or_crop" });

    const farm = await Farm.findById(fieldId);

    if (!farm)
      return res.status(404).json({ success: false, message: "field_not_found" });

    farm.selectedCrop = crop;
    farm.aiRecommendations = recommendations || [];

    await farm.save();

    const populated = await Farm.findById(fieldId).populate(FARM_POPULATE);

    res.json({
      success: true,
      message: "crop_saved",
      farm: populated,
    });
  } catch (err) {
    console.error("saveSelectedCrop error:", err);
    res.status(500).json({ success: false, message: "save_crop_failed" });
  }
};

// =========================================================
// 7️⃣ MARK FIELD HARVESTED + ARCHIVE
// =========================================================
export const markFieldHarvested = async (req, res) => {
  try {
    const farm = await Farm.findById(req.params.id);

    if (!farm)
      return res.status(404).json({ success: false, message: "field_not_found" });

    farm.archived = true;
    farm.completedAt = new Date();

    await farm.save();

    const populated = await Farm.findById(farm._id).populate(FARM_POPULATE);

    res.json({ success: true, message: "field_harvested", farm: populated });
  } catch (err) {
    console.error("markFieldHarvested:", err);
    res.status(500).json({ success: false, message: "harvest_error" });
  }
};

// =========================================================
// 8️⃣ GET TASKS BY USER
// =========================================================
export const getTasksByUser = async (req, res) => {
  try {
    const farms = await Farm.find({ userId: req.params.userId }).populate(
      FARM_POPULATE
    );

    const allTasks = farms.flatMap((f) =>
      (f.tasks || []).map((t) => ({
        ...t,
        fieldName: f.fieldName,
        crop: f.selectedCrop,
        user: f.userId,
      }))
    );

    res.json({ success: true, tasks: allTasks });
  } catch (err) {
    console.error("getTasksByUser error:", err);
    res.status(500).json({ success: false, message: "server_error" });
  }
};

// =========================================================
// 9️⃣ COMPLETE TASK (PLANTING → set plantedDate)
// =========================================================
export const completeTask = async (req, res) => {
  try {
    const taskId = req.params.id;

    const task = await Task.findById(taskId);
    if (!task)
      return res.status(404).json({ success: false, message: "task_not_found" });

    task.completed = true;

    await task.save();

    // If planting → set plantedDate on farm
    if (task.type?.toLowerCase().includes("plant")) {
      await Farm.findByIdAndUpdate(task.fieldId, {
        plantedDate: new Date(),
      });
    }

    // If harvesting → store kilos + harvestDate + archive
    if (task.type?.toLowerCase().includes("harvest")) {
      await Farm.findByIdAndUpdate(task.fieldId, {
        harvestDate: new Date(),
        archived: true,
        completedAt: new Date(),
      });
    }

    res.json({ success: true, task });
  } catch (err) {
    console.error("completeTask error:", err);
    res.status(500).json({ success: false, message: "task_update_failed" });
  }
};

// =========================================================
// 🔟 GET COMPLETED (ARCHIVED) FIELDS
// =========================================================
export const getCompletedFields = async (req, res) => {
  try {
    const fields = await Farm.find({
      userId: req.params.userId,
      archived: true,
    })
      .populate(FARM_POPULATE)
      .sort({ completedAt: -1 });

    res.json({ success: true, completed: fields });
  } catch (err) {
    console.error("getCompletedFields error:", err);
    res.status(500).json({ success: false, message: "server_error" });
  }
};