import React, { useState, useEffect } from "react";
import api, { userAPI } from "../config/api";

export default function ContributionForm() {
  const [groups, setGroups] = useState([]);
  const [goals, setGoals] = useState([]);
  const [users, setUsers] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [groupMembers, setGroupMembers] = useState([]); // ✅ Dynamic members for selected group
  const [form, setForm] = useState({
    group_id: "",
    goal_id: "",
    contributor_id: "",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [groupsRes, usersRes, goalsRes, contributionsRes] = await Promise.all([
        api.get("/groups", { params: { mine: true } }),
        userAPI.getAll(),
        api.get("/goals"),
        api.get("/contributions"),
      ]);
      setGroups(groupsRes.data);
      setUsers(usersRes.data);
      setGoals(goalsRes.data);
      setContributions(contributionsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  // ✅ When group changes, update group members dynamically (including creator)
  const handleGroupChange = (e) => {
    const groupId = e.target.value;
    setForm({ ...form, group_id: groupId, contributor_id: "" });

    const selectedGroup = groups.find((g) => g._id === groupId);
    if (!selectedGroup) {
      setGroupMembers([]);
      return;
    }

    const membersList = [];

    // ✅ Include group members
    if (selectedGroup.members?.length > 0) {
      selectedGroup.members.forEach((m) => {
        const user = users.find((u) => u._id === m.user_id);
        if (user) membersList.push({ _id: user._id, name: user.name });
      });
    }

    // ✅ Include the group creator (avoid duplicates)
    if (selectedGroup.created_by) {
      const creator = users.find((u) => u._id === selectedGroup.created_by);
      if (creator && !membersList.some((m) => m._id === creator._id)) {
        membersList.push({ _id: creator._id, name: `${creator.name} (Creator)` });
      }
    }

    setGroupMembers(membersList);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/contributions", form);
      alert("Contribution added successfully!");
      setForm({
        group_id: "",
        goal_id: "",
        contributor_id: "",
        amount: "",
        date: new Date().toISOString().slice(0, 10),
        description: "",
      });
      setGroupMembers([]);
      fetchAllData();
    } catch (error) {
      console.error("Error adding contribution:", error);
      alert("Failed to add contribution");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this contribution?")) return;
    try {
      await api.delete(`/contributions/${id}`);
      alert("Contribution deleted!");
      fetchAllData();
    } catch (error) {
      console.error("Error deleting contribution:", error);
      alert("Failed to delete");
    }
  };

  // ✅ Helper functions for populated data
  const getUserName = (user) => (user?.name ? user.name : "Unknown");
  const getGoalName = (goal) => (goal?.goal_name ? goal.goal_name : "Unknown");
  const getGroupName = (group) => (group?.name ? group.name : "Unknown");

  return (
    <div style={{ padding: "20px", maxWidth: "700px", margin: "0 auto" }}>
      <h2>💸 Add Contribution</h2>

      {/* Add Contribution Form */}
      <form onSubmit={handleSubmit}>
        {/* ✅ Group Selection */}
        <label>Group *</label>
        <select
          name="group_id"
          value={form.group_id}
          onChange={handleGroupChange}
          required
          style={{ width: "100%", marginBottom: "10px" }}
        >
          <option value="">Select Group</option>
          {groups.map((g) => (
            <option key={g._id} value={g._id}>
              {g.name}
            </option>
          ))}
        </select>

        {/* ✅ Goal Selection */}
        <label>Goal *</label>
        <select
          name="goal_id"
          value={form.goal_id}
          onChange={handleChange}
          required
          style={{ width: "100%", marginBottom: "10px" }}
        >
          <option value="">Select Goal</option>
          {goals.map((goal) => (
            <option key={goal._id} value={goal._id}>
              {goal.goal_name}
            </option>
          ))}
        </select>

        {/* ✅ Contributor filtered by selected group (includes creator) */}
        <label>Contributor *</label>
        <select
          name="contributor_id"
          value={form.contributor_id}
          onChange={handleChange}
          required
          style={{ width: "100%", marginBottom: "10px" }}
          disabled={!form.group_id}
        >
          <option value="">
            {form.group_id ? "Select Member" : "Select a Group First"}
          </option>
          {groupMembers.map((user) => (
            <option key={user._id} value={user._id}>
              {user.name}
            </option>
          ))}
        </select>

        <label>Amount (₹) *</label>
        <input
          type="number"
          name="amount"
          value={form.amount}
          onChange={handleChange}
          required
          style={{ width: "100%", marginBottom: "10px" }}
        />

        <label>Date *</label>
        <input
          type="date"
          name="date"
          value={form.date}
          onChange={handleChange}
          required
          style={{ width: "100%", marginBottom: "10px" }}
        />

        <label>Description</label>
        <input
          type="text"
          name="description"
          value={form.description}
          onChange={handleChange}
          style={{ width: "100%", marginBottom: "10px" }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{ background: "#2196F3", color: "white", padding: "10px 15px" }}
        >
          {loading ? "Adding..." : "Add Contribution"}
        </button>
      </form>

      {/* Existing Contributions */}
      <h3 style={{ marginTop: "30px" }}>Existing Contributions</h3>

      <input
        type="text"
        placeholder="Search by contributor, goal, or group..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ width: "100%", marginBottom: "15px", padding: "8px" }}
      />

      {contributions.length === 0 ? (
        <p>No contributions recorded yet.</p>
      ) : (
        <ul>
          {contributions
            .filter(
              (c) =>
                getUserName(c.contributor_id).toLowerCase().includes(search.toLowerCase()) ||
                getGoalName(c.goal_id).toLowerCase().includes(search.toLowerCase()) ||
                getGroupName(c.group_id).toLowerCase().includes(search.toLowerCase())
            )
            .map((c) => (
              <li key={c._id} style={{ marginBottom: "10px" }}>
                <strong>{getUserName(c.contributor_id)}</strong> contributed ₹
                {c.amount} towards <em>{getGoalName(c.goal_id)}</em> in{" "}
                <strong>{getGroupName(c.group_id)}</strong> (
                {new Date(c.date).toLocaleDateString()})
                <button
                  onClick={() => handleDelete(c._id)}
                  style={{
                    marginLeft: "10px",
                    background: "#f44336",
                    color: "white",
                    border: "none",
                    padding: "5px 8px",
                    borderRadius: "4px",
                    cursor: "pointer",
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
