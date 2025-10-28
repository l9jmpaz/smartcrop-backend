import express from "express";
import { getAIRecommendations } from "../controllers/aiController.js";

const router = express.Router();

// ✅ Correct route path
router.get("/recommend/:userId", getAIRecommendations);

export default router;