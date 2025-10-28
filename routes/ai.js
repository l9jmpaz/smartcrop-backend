import express from "express";
import { getAIRecommendations } from "../controllers/aiController.js";

const router = express.Router();

// Route to get AI recommendations
router.get("/recommend/:userId", getAIRecommendations);

export default router;