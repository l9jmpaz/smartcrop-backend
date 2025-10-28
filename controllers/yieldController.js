import Yield from "../models/Yield.js";

// Add a new yield record
export const addYield = async (req, res) => {
  try {
    const yieldData = new Yield(req.body);
    await yieldData.save();
    res.status(201).json({ success: true, message: "Yield recorded", yield: yieldData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get all yields by user
export const getYieldsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const yields = await Yield.find({ userId }).sort({ harvestDate: -1 });
    res.status(200).json({ success: true, yields });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};