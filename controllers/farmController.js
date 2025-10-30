import Farm from "../models/Farm.js";

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
