const mongoose = require("mongoose");

const ContributionSchema = new mongoose.Schema(
  {
    goal_id: { type: mongoose.Schema.Types.ObjectId, ref: "Goals", required: true },
    group_id: { type: mongoose.Schema.Types.ObjectId, ref: "Groups", required: true },
    contributor_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true },
    description: { type: String, trim: true },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

module.exports = mongoose.model("Contributions", ContributionSchema, "Contributions");
