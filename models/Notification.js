import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    title: String,
    message: String,

    type: {
      type: String,
      enum: ["system", "user", "reply"], // ✅ FIXED (added reply)
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Notification", NotificationSchema);