import Farm from "../models/Farm.js";
import mongoose from "mongoose";
import Notification from "../models/Notification.js";
import User from "../models/User.js"; // 🧑 To fetch username for better messages

// ✅ Fetch all farms owned by a specific user
export const getFarmByUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const farms = await Farm.find({ userId });

    if (!farms || farms.length === 0) {
      return res.status(200).json({
        success: true,
        farms: [],
        message: "No fields added yet.",
      });
    }

    res.status(200).json({
      success: true,
      farms,
    });
  } catch (err) {
    console.error("❌ Error fetching farms:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching farms.",
    });
  }
};

// ✅ Add new task to a specific field (farm)
export const addTask = async (req, res) => {
  try {
    const { userId, fieldId, fieldName, date, type, crop, kilos } = req.body;

    if (!userId || !fieldId || !date || !type) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields." });
    }

    const farm = await Farm.findById(fieldId);
    if (!farm) {
      return res.status(404).json({ success: false, message: "Farm not found." });
    }

    const newTask = {
      _id: new mongoose.Types.ObjectId(),
      userId: new mongoose.Types.ObjectId(userId),
      type,
      crop,
      date: new Date(`${date}T12:00:00Z`),
      fieldName: fieldName || farm.fieldName,
      completed: false,
      createdAt: new Date(),
      kilos: kilos ? Number(kilos) : 0,
    };

    farm.tasks.push(newTask);
    await farm.save();

    res.status(201).json({
      success: true,
      message: "Task added successfully.",
      task: newTask,
    });
  } catch (err) {
    console.error("❌ Error adding task:", err);
    res.status(500).json({
      success: false,
      message: "Server error while adding task.",
      error: err.message,
    });
  }
};

// ✅ Get yield data by user (for all fields)
export const getYieldDataByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const farms = await Farm.find({ userId });

    const yieldData = farms.map((farm) => {
      const fieldSize = farm.fieldSize || 1;
      const harvests = farm.tasks.filter(
        (t) => t.type?.toLowerCase().includes("harvest") && t.kilos
      );
      const yearly = {};
      harvests.forEach((t) => {
        const year = new Date(t.date).getFullYear();
        yearly[year] = (yearly[year] || 0) + t.kilos / fieldSize;
      });
      return {
        fieldName: farm.fieldName,
        yields: Object.entries(yearly).map(([year, y]) => ({
          year: Number(year),
          yield: y,
        })),
      };
    });

    res.json({ success: true, yieldData });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ✅ Fetch all tasks for a specific user
export const getTasksByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const farms = await Farm.find({ userId });
    if (!farms || farms.length === 0) {
      return res.status(200).json({ success: true, tasks: [] });
    }

    const allTasks = farms.flatMap((farm) =>
      (farm.tasks || []).map((task) => ({
        _id: task._id,
        ...task.toObject(),
        fieldId: farm._id,
        fieldName: farm.fieldName,
      }))
    );

    res.status(200).json({
      success: true,
      count: allTasks.length,
      tasks: allTasks,
    });
  } catch (err) {
    console.error("❌ Error fetching tasks:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching tasks.",
      error: err.message,
    });
  }
};

// ✅ Mark a task as complete + notify admin
export const completeTask = async (req, res) => {
  try {
    const { id } = req.params;
    const farm = await Farm.findOne({ "tasks._id": id });
    if (!farm) {
      return res.status(404).json({
        success: false,
        message: "Task not found in any farm.",
      });
    }

    const task = farm.tasks.id(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found in the farm.",
      });
    }

    task.completed = true;
    await farm.save();

    // 🟢 Notify admin about task completion
    await Notification.create({
      title: "Task Completed",
      message: `Task "${task.type}" in field "${farm.fieldName}" has been completed.`,
      type: "system",
    });

    res.status(200).json({
      success: true,
      message: "Task marked as completed successfully!",
      task,
    });
  } catch (err) {
    console.error("❌ Complete task error:", err);
    res.status(500).json({
      success: false,
      message: "Server error while completing task.",
      error: err.message,
    });
  }
};

// ✅ Update or create a single default farm
export const updateFarm = async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;
    let farm = await Farm.findOne({ userId });

    if (farm) {
      farm = await Farm.findOneAndUpdate({ userId }, updates, { new: true });
    } else {
      farm = new Farm({ userId, ...updates });
      await farm.save();
    }

    await Notification.create({
      title: "Farm Updated",
      message: `Farm "${farm.fieldName || "Unnamed"}" has been updated by user ${userId}.`,
      type: "system",
    });

    res.status(200).json({
      success: true,
      farm,
      message: "Farm updated successfully.",
    });
  } catch (err) {
    console.error("❌ Error updating farm:", err);
    res.status(500).json({
      success: false,
      message: "Server error while updating farm.",
    });
  }
};

// ✅ Add new farm field (for multiple fields)
export const addFarmField = async (req, res) => {
  try {
    const {
      userId,
      fieldName,
      soilType,
      wateringMethod,
      lastYearCrop,
      fieldSize,
      location,
    } = req.body;

    if (!userId || !fieldName) {
      return res
        .status(400)
        .json({ success: false, message: "userId and fieldName are required." });
    }

    const newFarm = new Farm({
      userId,
      fieldName,
      soilType,
      wateringMethod,
      lastYearCrop,
      fieldSize,
      location,
    });

    const user = await User.findById(userId);
    await Notification.create({
      title: "New Field Added",
      message: `${fieldName} was added by ${user?.username || "a farmer"} from ${user?.barangay || "unknown barangay"}.`,
      type: "system",
    });

    await newFarm.save();
    res.status(201).json({
      success: true,
      message: "Field added successfully!",
      farm: newFarm,
    });
  } catch (err) {
    console.error("❌ Error adding field:", err);
    res.status(500).json({
      success: false,
      message: "Server error while adding field.",
      error: err.message,
    });
  }
};

// ✅ Update existing field by ID
export const updateFieldById = async (req, res) => {
  try {
    const updated = await Farm.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Farm field not found.",
      });
    }

    await Notification.create({
      title: "Field Updated",
      message: `Field "${updated.fieldName}" was updated successfully.`,
      type: "system",
    });

    res.status(200).json({
      success: true,
      farm: updated,
      message: "Field updated successfully.",
    });
  } catch (err) {
    console.error("❌ Error updating field:", err);
    res.status(500).json({
      success: false,
      message: "Server error while updating field.",
    });
  }
};

// ✅ Get yield per field
export const getYieldStats = async (req, res) => {
  try {
    const { userId } = req.params;
    const farms = await Farm.find({ userId });
    if (!farms || farms.length === 0) {
      return res.status(404).json({ success: false, message: "No farms found for user." });
    }

    const yields = [];
    farms.forEach((farm) => {
      const harvests = farm.tasks.filter(
        (t) => t.type.toLowerCase() === "harvest" && t.completed && t.date
      );

      if (harvests.length > 0) {
        const groupedByYear = {};
        harvests.forEach((h) => {
          const year = new Date(h.date).getFullYear();
          if (!groupedByYear[year]) groupedByYear[year] = [];
          groupedByYear[year].push(h);
        });

        Object.keys(groupedByYear).forEach((year) => {
          const totalKilos = groupedByYear[year].reduce((sum, h) => sum + (h.kilos || 0), 0);
          const area = farm.fieldSize || 1;
          const yieldPerHectare = totalKilos / area;
          yields.push({
            fieldId: farm._id,
            fieldName: farm.fieldName,
            crop: farm.lastYearCrop,
            year: parseInt(year),
            yield: yieldPerHectare.toFixed(2),
          });
        });
      }
    });

    return res.status(200).json({ success: true, yields });
  } catch (err) {
    console.error("❌ Error fetching yield stats:", err);
    res.status(500).json({
      success: false,
      message: "Server error while calculating yields.",
      error: err.message,
    });
  }
};

// ✅ Delete field by ID + notify
export const deleteFieldById = async (req, res) => {
  try {
    const deleted = await Farm.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Farm field not found.",
      });
    }

    await Notification.create({
      title: "Field Deleted",
      message: `Farm field "${deleted.fieldName}" was deleted by user ${deleted.userId}.`,
      type: "system",
    });

    res.status(200).json({
      success: true,
      message: "Farm field deleted successfully.",
    });
  } catch (err) {
    console.error("❌ Error deleting field:", err);
    res.status(500).json({
      success: false,
      message: "Server error while deleting field.",
    });
  }
};