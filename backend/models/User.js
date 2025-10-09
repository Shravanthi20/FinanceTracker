const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    // Keep camelCase to match existing routes (auth.js uses passwordHash)
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["personal", "business", "group_member"],
      default: "personal",
    },
    currency: { type: String, default: "INR" },
    groups: [{ type: mongoose.Schema.Types.ObjectId, ref: "Group", default: [] }],
    notificationPreferences: {
      channel: { type: String, enum: ["email", "sms", "none"], default: "email" },
      emailEnabled: { type: Boolean, default: true },
      smsEnabled: { type: Boolean, default: false },
      phone: { type: String, default: null },
      timezone: { type: String, default: "UTC" }
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema, "Users");
