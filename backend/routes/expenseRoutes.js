const express = require("express");
const { ObjectId } = require("mongodb");

function expenseRoutes(Expenses) {
  const router = express.Router();

  // Get all expenses
  router.get("/", async (req, res) => {
    try {
      const expenses = await Expenses.find().toArray();
      res.json(expenses);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Create expense
  router.post("/", async (req, res) => {
    try {
      const { description, amount, group_id, members } = req.body;
      if (
        !description ||
        !amount ||
        !group_id ||
        !Array.isArray(members) ||
        members.length === 0
      ) {
        return res.status(400).json({ error: "Invalid expense data" });
      }

      const formattedMembers = members.map((m) => ({
        user_id: new ObjectId(m.user_id),
        share: parseFloat(m.share) || 0,
      }));

      const expense = {
        description,
        amount: parseFloat(amount),
        group_id: new ObjectId(group_id),
        members: formattedMembers,
        created_at: new Date(),
      };

      const result = await Expenses.insertOne(expense);
      res.status(201).json({ message: "Expense created", expenseId: result.insertedId });
    } catch (err) {
      console.error("Error creating expense:", err);
      res.status(500).json({ error: "Failed to create expense" });
    }
  });

  // Update expense
  router.put("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { description, amount, members } = req.body;

      const updateData = {};
      if (description) updateData.description = description;
      if (amount) updateData.amount = parseFloat(amount);
      if (Array.isArray(members)) {
        updateData.members = members.map((m) => ({
          user_id: new ObjectId(m.user_id),
          share: parseFloat(m.share) || 0,
        }));
      }
      updateData.updated_at = new Date();

      const result = await Expenses.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "Expense not found" });
      }

      res.json({ message: "Expense updated successfully" });
    } catch (err) {
      console.error("Error updating expense:", err);
      res.status(500).json({ error: "Failed to update expense" });
    }
  });

  // Delete expense
  router.delete("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const result = await Expenses.deleteOne({ _id: new ObjectId(id) });

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Expense not found" });
      }

      res.json({ message: "Expense deleted successfully" });
    } catch (err) {
      console.error("Error deleting expense:", err);
      res.status(500).json({ error: "Failed to delete expense" });
    }
  });

  return router;
}

module.exports = expenseRoutes;


