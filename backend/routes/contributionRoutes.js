const express = require("express");
const auth = require("../middleware/auth");
const Contributions = require("../models/Contribution");
const Goals = require("../models/Goal");
const Groups = require("../models/Groups");
const User = require("../models/User"); // ✅ User model imported explicitly

const router = express.Router();

// ✅ Require authentication for all routes
router.use(auth);

// ✅ Get all contributions (optionally filtered by group or goal)
router.get("/", async (req, res) => {
  try {
    const { group_id, goal_id, mine } = req.query;
    const query = {};

    // 🧠 If "mine" query param is true, show only current user's contributions
    if (mine === "true") query.contributor_id = req.user.id;
    if (group_id) query.group_id = group_id;
    if (goal_id) query.goal_id = goal_id;

    // ✅ Populate related fields explicitly
    const contributions = await Contributions.find(query)
      .populate({ path: "contributor_id", select: "name email", model: User })
      .populate({ path: "goal_id", select: "goal_name target_amount", model: Goals })
      .populate({ path: "group_id", select: "name", model: Groups })
      .lean();

    res.json(contributions);
  } catch (error) {
    console.error("❌ Error fetching contributions:", error);
    res.status(500).json({ error: "Failed to fetch contributions" });
  }
});

// ✅ Add new contribution (and reflect in user account)
router.post("/", async (req, res) => {
  try {
    const { goal_id, group_id, contributor_id, amount, date, description } = req.body;

    if (!goal_id || !group_id || !contributor_id || !amount || !date) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // ✅ Validate references
    const goalExists = await Goals.findById(goal_id);
    const groupExists = await Groups.findById(group_id);
    const userExists = await User.findById(contributor_id);

    if (!goalExists) return res.status(404).json({ error: "Goal not found" });
    if (!groupExists) return res.status(404).json({ error: "Group not found" });
    if (!userExists) return res.status(404).json({ error: "Contributor not found" });

    // ✅ Create contribution
    const contribution = await Contributions.create({
      goal_id,
      group_id,
      contributor_id,
      amount: parseFloat(amount),
      date: new Date(date),
      description: description?.trim() || "",
    });

    // ✅ Reflect it in the user's profile
    await User.findByIdAndUpdate(contributor_id, {
      $push: { contributions: contribution._id },
    });

    res.status(201).json({
      message: "✅ Contribution added successfully and reflected in user account",
      contribution,
    });
  } catch (error) {
    console.error("🔥 Error adding contribution:", error);
    res.status(500).json({ error: "Failed to add contribution" });
  }
});

// ✅ Delete a contribution (and remove from user record)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Contributions.findByIdAndDelete(id);
    if (!deleted)
      return res.status(404).json({ error: "Contribution not found" });

    // 🧹 Also remove it from the user's contributions array
    await User.findByIdAndUpdate(deleted.contributor_id, {
      $pull: { contributions: deleted._id },
    });

    res.json({ message: "🗑️ Contribution deleted successfully and removed from user account" });
  } catch (error) {
    console.error("❌ Error deleting contribution:", error);
    res.status(500).json({ error: "Failed to delete contribution" });
  }
});

module.exports = router;
