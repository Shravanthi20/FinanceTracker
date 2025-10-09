import React, { useState, useEffect } from "react";
import api from "../config/api";

export default function GoalBasedSavings() {
  const [form, setForm] = useState({
    goal_name: "",
    target_amount: "",
    deadline: "",
    description: "",
    group_id: "",
  });
  const [groups, setGroups] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch (_) {
      return null;
    }
  })();

  useEffect(() => {
    fetchGroups();
    fetchGoals();
  }, []);

  const fetchGroups = async () => {
    try {
      const res = await api.get("/groups", { params: { mine: true } });
      setGroups(res.data);
    } catch (err) {
      console.error("Error fetching groups:", err);
    }
  };

  const fetchGoals = async () => {
    try {
      const res = await api.get("/goals");
      setGoals(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching goals:", err);
      setLoading(false);
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/goals", form);
      alert("Goal created successfully!");
      setForm({ goal_name: "", target_amount: "", deadline: "", description: "", group_id: "" });
      fetchGoals();
    } catch (err) {
      console.error("Error creating goal:", err);
      alert("Failed to create goal");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this goal?")) return;
    try {
      await api.delete(`/goals/${id}`);
      alert("Goal deleted successfully!");
      fetchGoals();
    } catch (err) {
      console.error("Error deleting goal:", err);
      alert("Failed to delete goal");
    }
  };

  const getGroupName = (id) => groups.find((g) => g._id === id)?.name || "Personal";

  if (loading) return <div>Loading goals...</div>;

  return (
    <div style={{ padding: "20px", maxWidth: "700px", margin: "0 auto" }}>
      <h2>🎯 Goal-Based Savings</h2>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "10px" }}>
          <label>Goal Name:</label>
          <input
            type="text"
            name="goal_name"
            value={form.goal_name}
            onChange={handleChange}
            required
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          />
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label>Target Amount (₹):</label>
          <input
            type="number"
            name="target_amount"
            value={form.target_amount}
            onChange={handleChange}
            required
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          />
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label>Deadline:</label>
          <input
            type="date"
            name="deadline"
            value={form.deadline}
            onChange={handleChange}
            required
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          />
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label>Group (optional):</label>
          <select
            name="group_id"
            value={form.group_id}
            onChange={handleChange}
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          >
            <option value="">Personal Goal</option>
            {groups.map((g) => (
              <option key={g._id} value={g._id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label>Description:</label>
          <input
            type="text"
            name="description"
            value={form.description}
            onChange={handleChange}
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{ backgroundColor: "#4CAF50", color: "white", padding: "10px 20px" }}
        >
          {loading ? "Creating..." : "Create Goal"}
        </button>
      </form>

      <h3 style={{ marginTop: "30px" }}>Existing Goals</h3>

      <input
        type="text"
        placeholder="Search goals..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ width: "100%", padding: "8px", marginBottom: "15px" }}
      />

      {goals.length === 0 ? (
        <p>No goals yet.</p>
      ) : (
        <ul>
          {goals
            .filter((g) => g.goal_name.toLowerCase().includes(search.toLowerCase()))
            .map((g) => (
              <li key={g._id} style={{ marginBottom: "8px" }}>
                <strong>{g.goal_name}</strong> — Target: ₹{g.target_amount} •{" "}
                {getGroupName(g.group_id)}
                <br />
                Deadline: {new Date(g.deadline).toLocaleDateString()}
                <br />
                {g.description && <i>{g.description}</i>}
                <button
                  onClick={() => handleDelete(g._id)}
                  style={{
                    marginLeft: "10px",
                    background: "#ff4444",
                    color: "white",
                    border: "none",
                    padding: "5px 10px",
                    borderRadius: "4px",
                  }}
                >
                  Delete
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
