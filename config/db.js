// config/db.js
import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || "mongodb+srv://l9jmpaz_db_user:Decten19@cluster0.w0lhhob.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

    if (!mongoURI) {
      throw new Error("❌ MONGO_URI is not defined in environment variables!");
    }

    // ✅ Modern, recommended connection options
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // wait up to 30s for connection
      socketTimeoutMS: 45000, // prevent timeouts on slow networks
      maxPoolSize: 10, // limit connections (good for Render)
      connectTimeoutMS: 30000,
    });

    console.log("✅ MongoDB connected successfully!");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);

    // 🕒 Retry after 5 seconds (helpful for Render cold starts)
    setTimeout(connectDB, 5000);
  }
};

export default connectDB;