import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
const uri = process.env.MONGO_URI || "your full mongo connection string here";

await mongoose.connection.db.collection("farms").updateMany(
  { tasks: { $type: "string" } },
  { $unset: { tasks: "" } }
);

await mongoose.connection.db.collection("farms").updateMany(
  { tasks: { $exists: false } },
  { $set: { tasks: [] } }
);
