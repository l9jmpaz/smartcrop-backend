import express from "express";
import { getFarmByUser, updateFarm } from "../controllers/farmController.js";

const router = express.Router();
router.get("/debug", (req,res)=>{res.send("Farm Route Mounted Correctly!")});
// ✅ Fetch Farm Data by User ID
router.get("/:userId", getFarmByUser);

// ✅ Update or Create Farm Info
router.put("/update/:userId", updateFarm);

export default router;