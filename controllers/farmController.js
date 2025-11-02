import Farm from "../models/Farm.js";
import mongoose from "mongoose";
// ✅ Fetch all farms owned by a specific user
export const getFarmByUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const farms = await Farm.find({ userId });

    // 🟢 Return an empty list if no farms exist (Flutter expects an array)
    if (!farms || farms.length === 0) {
      return res.status(200).json({
        success: true,
        farms: [],
        message: "No fields added yet.",
      });
    }
  

    // 🟢 Return all farm fields
    res.status(200).json({
      success: true,
      farms, // ✅ Flutter uses this key
    });
  } catch (err) {
    console.error("❌ Error fetching farms:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching farms.",
    });
  }
};



// ✅ Add new task to a user's farm
// ✅ Add new task to a specific farm field
// ✅ Add new task to a specific field (farm)
export const addTask = async (req, res) => {
  try {
    const { userId, fieldId, fieldName, date, type, crop, kilos } = req.body;

    if (!userId || !fieldId || !date || !type) {
      return res.status(400).json({ success: false, message: "Missing required fields." });
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
  date: new Date(`${date}T12:00:00Z`), // ✅ timezone fix
  fieldName: fieldName || farm.fieldName,
  completed: false,
  createdAt: new Date(),
  kilos: kilos ? Number(kilos) : 0,
};

    farm.tasks.push(newTask);
    await farm.save();

    return res.status(201).json({
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

// ✅ Fetch all tasks for a specific user
export const getTasksByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // 🧠 Find all farms belonging to this user
    const farms = await Farm.find({ userId });
    if (!farms || farms.length === 0) {
      return res.status(200).json({ success: true, tasks: [] });
    }

    // 🧩 Safely merge tasks even if some farms have none
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


// ✅ Mark a task as complete
export const completeTask = async (req, res) => {
  try {
    const { id } = req.params; // this is the task _id (inside farm.tasks array)

    // 🧠 Find the farm that contains this task
    const farm = await Farm.findOne({ "tasks._id": id });
    if (!farm) {
      return res.status(404).json({
        success: false,
        message: "Task not found in any farm.",
      });
    }

    // ✅ Locate and mark the task as completed
    const task = farm.tasks.id(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found in the farm.",
      });
    }

    task.completed = true;
    await farm.save();

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
}
// ✅ Update or create a single default farm (for backward compatibility)
export const updateFarm = async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    // 🟢 Find existing main farm or create a new one
    let farm = await Farm.findOne({ userId });
    if (farm) {
      farm = await Farm.findOneAndUpdate({ userId }, updates, { new: true });
    } else {
      farm = new Farm({ userId, ...updates });
      await farm.save();
    }

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

// ✅ Add new farm field (for multiple fields support)
export const addFarmField = async (req, res) => {
  try {
    const { userId, fieldName, soilType, wateringMethod, lastYearCrop, fieldSize } = req.body;

    const farm = new Farm({
      userId,
      fieldName,
      soilType,
      wateringMethod,
      lastYearCrop,
      fieldSize,
    });

    await farm.save();

    res.status(201).json({
      success: true,
      farm,
      message: "New farm field added successfully.",
    });
  } catch (err) {
    console.error("❌ Error adding farm field:", err);
    res.status(500).json({
      success: false,
      message: "Server error while adding farm field.",
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

// ✅ Delete field by ID
export const deleteFieldById = async (req, res) => {
  try {
    const deleted = await Farm.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Farm field not found.",
      });
    }
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
