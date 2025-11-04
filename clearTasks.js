import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
const uri = process.env.MONGO_URI || "your full mongo connection string here";

await mongoose.connect(uri);
const res = await mongoose.connection.db.collection("farms").updateMany({}, { $unset: { tasks: 1 } });
console.log(res);
await mongoose.disconnect();