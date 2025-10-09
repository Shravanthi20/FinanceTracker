const express = require("express");
const auth = require("../middleware/auth");
const Goals = require("../models/Goal");
const Groups = require("../models/Groups");

const router = express.Router();

// ✅ All routes require authentication
router.use(auth);

// ✅ GET all goals (optionally filter by group)
router.get("/", async (req, res) => {
  try {
    const { group_id } = req.query;
    const query = {};
    if (group_id) query.group_id = group_id;

    const goals = await Goals.find(query)
      .populate("group_id", "name")
      .populate("created_by", "name email")
      .lean();

    res.json(goals);
  } catch (error) {
    console.error("❌ Error fetching goals:", error);
    res.status(500).json({ error: "Failed to fetch goals" });
  }
});

// ✅ Create a new goal
router.post("/", async (req, res) => {
  try {
    const { goal_name, target_amount, deadline, group_id, description } = req.body;
    const created_by = req.user.id;

    if (!goal_name || !target_amount || !deadline) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Optional group validation
    if (group_id) {
      const groupExists = await Groups.findById(group_id);
      if (!groupExists) return res.status(404).json({ error: "Group not found" });
    }

    const goal = await Goals.create({
      goal_name: goal_name.trim(),
      target_amount: parseFloat(target_amount),
      deadline: new Date(deadline),
      group_id: group_id || null,
      description: description?.trim() || "",
      created_by,
    });

    res.status(201).json({
      message: "✅ Goal created successfully",
      goal,
    });
  } catch (error) {
    console.error("🔥 Error creating goal:", error);
    res.status(500).json({ error: "Failed to create goal" });
  }
});

// ✅ Update goal
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { goal_name, target_amount, deadline, description } = req.body;

    const goal = await Goals.findById(id);
    if (!goal) return res.status(404).json({ error: "Goal not found" });

    if (String(goal.created_by) !== String(req.user.id)) {
      return res.status(403).json({ error: "Only the creator can update this goal" });
    }

    const updates = {
      ...(goal_name && { goal_name }),
      ...(target_amount && { target_amount: parseFloat(target_amount) }),
      ...(deadline && { deadline: new Date(deadline) }),
      ...(description && { description }),
      updated_at: new Date(),
    };

    await Goals.findByIdAndUpdate(id, { $set: updates });
    res.json({ message: "✅ Goal updated successfully" });
  } catch (error) {
    console.error("❌ Error updating goal:", error);
    res.status(500).json({ error: "Failed to update goal" });
  }
});

// ✅ Delete goal
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const goal = await Goals.findById(id);
    if (!goal) return res.status(404).json({ error: "Goal not found" });

    if (String(goal.created_by) !== String(req.user.id)) {
      return res.status(403).json({ error: "Only the creator can delete this goal" });
    }

    await Goals.findByIdAndDelete(id);
    res.json({ message: "🗑️ Goal deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting goal:", error);
    res.status(500).json({ error: "Failed to delete goal" });
  }
});

module.exports = router;
