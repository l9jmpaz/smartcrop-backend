// routes/feedback.js
import express from "express";
import Feedback from "../models/Feedback.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const feedback = await Feedback.find().populate("user", "name email").sort({ createdAt: -1 });
  res.json(feedback);
});

router.post("/", async (req, res) => {
  const { userId, message } = req.body;
  const fb = await Feedback.create({ user: userId, message });
  res.json(fb);
});

export default router;
