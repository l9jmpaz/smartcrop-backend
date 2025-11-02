import express from "express";
import multer from "multer";
import { updateUser, uploadProfilePicture } from "../controllers/userController.js";

const router = express.Router();

// ✅ Set up file upload path
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/profile_pictures");
  },
  filename: (req, file, cb) => {
    const ext = file.originalname.split(".").pop();
    cb(null, `${req.params.id}_${Date.now()}.${ext}`);
  },
});

const upload = multer({ storage });

// ✅ Update name/password
router.put("/update/:id", updateUser);

// ✅ Upload profile picture
router.post("/upload/:id", upload.single("image"), uploadProfilePicture);

export default router;