// backend/models/User.js
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  barangay: {type: String, required: true },
  profilePicture: {type: String, default: ""},
  role: { type: String, default: "user" },
  lastActive: { type: Date, default: null },
status: { type: String, default: "Inactive" },

  // 🌾 Farm setup details
  farm: {
    farmName: { type: String },
    farmSize: { type: String },
    numFields: { type: String },
    fieldName: { type: String },
    cropType: { type: String },
    soilType: { type: String },
    location: {
      lat: { type: Number },
      lng: { type: Number },
    },
  },
});

export default mongoose.model("User", UserSchema);