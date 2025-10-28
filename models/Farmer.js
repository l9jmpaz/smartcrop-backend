import mongoose from "mongoose";

const farmerSchema = new mongoose.Schema({
  name: String,
  crop: String,
  yield: { type: Number, default: 0 },
  location: String,
  status: { type: String, enum: ["Active", "Inactive"], default: "Active" }
});

export default mongoose.model("Farmer", farmerSchema);