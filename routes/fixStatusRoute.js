import express from "express";
import User from "../models/User.js";

const router = express.Router();

router.get("/fix-status", async (req, res) => {
  try {
    const result = await User.updateMany({}, { $set: { status: "Inactive" } });

    res.send({
      success: true,
      matched: result.matchedCount,
      modified: result.modifiedCount,
      message: "All users set to Inactive"
    });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
});

export default router;
