import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const uri = process.env.MONGO_URI || "YOUR_MONGODB_CONNECTION_STRING";

const fixTasks = async () => {
  try {
    await mongoose.connect(uri);
    console.log("✅ Connected to MongoDB");

    const farms = mongoose.connection.db.collection("farms");

    // 🧹 Remove invalid "tasks" fields that are strings
    const res1 = await farms.updateMany(
      { tasks: { $type: "string" } },
      { $unset: { tasks: "" } }
    );
    console.log("🧹 Removed string tasks:", res1.modifiedCount);

    // 🧩 Ensure all farms have a proper array
    const res2 = await farms.updateMany(
      { tasks: { $exists: false } },
      { $set: { tasks: [] } }
    );
    console.log("✅ Ensured tasks arrays:", res2.modifiedCount);

    await mongoose.disconnect();
    console.log("✨ Done cleaning up tasks!");
  } catch (err) {
    console.error("❌ Error fixing tasks:", err);
  }
};

fixTasks();