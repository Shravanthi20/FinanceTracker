const mongoose = require("mongoose");

const GoalSchema = new mongoose.Schema(
  {
    goal_name: { type: String, required: true, trim: true },
    target_amount: { type: Number, required: true, min: 1 },
    deadline: { type: Date, required: true },
    description: { type: String, trim: true },
    group_id: { type: mongoose.Schema.Types.ObjectId, ref: "Groups" }, // optional
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

module.exports = mongoose.model("Goals", GoalSchema, "Goals");
