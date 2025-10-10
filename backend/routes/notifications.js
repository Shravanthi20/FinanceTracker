const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Reminder = require('../models/Reminder');

const router = express.Router();

// Get current user's notification preferences
router.get('/preferences', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('email notificationPreferences');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.notificationPreferences || {});
  } catch (err) {
    res.status(500).json({ message: 'Failed to load preferences', error: err.message });
  }
});

// Update current user's notification preferences (in-app only)
router.put('/preferences', auth, async (req, res) => {
  try {
    const { timezone, bills, budgets, groupAlerts, smartReminders } = req.body;
    const update = {
      'notificationPreferences.timezone': timezone,
      'notificationPreferences.bills': bills,
      'notificationPreferences.budgets': budgets,
      'notificationPreferences.groupAlerts': groupAlerts,
      'notificationPreferences.smartReminders': smartReminders,
    };
    const user = await User.findByIdAndUpdate(req.user.id, { $set: update }, { new: true, runValidators: true }).select('notificationPreferences');
    res.json(user.notificationPreferences);
  } catch (err) {
    res.status(400).json({ message: 'Failed to update preferences', error: err.message });
  }
});

// Create a reminder for the current user
router.post('/reminders', auth, async (req, res) => {
  try {
    const { message, sendAt } = req.body;
    const doc = await Reminder.create({ user_id: req.user.id, message, sendAt: new Date(sendAt) });
    res.status(201).json(doc);
  } catch (err) {
    res.status(400).json({ message: 'Failed to create reminder', error: err.message });
  }
});

// List in-app reminders (pending or include sent)
router.get('/reminders', auth, async (req, res) => {
  try {
    const { includeSent = 'false' } = req.query;
    const query = { user_id: req.user.id };
    if (includeSent !== 'true') query.sent = false;
    const docs = await Reminder.find(query).sort({ sendAt: 1 }).limit(200);
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load reminders', error: err.message });
  }
});

// Notification history for current user
router.get('/history', auth, async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const docs = await Reminder.find({ user_id: req.user.id }).sort({ createdAt: -1 }).limit(Number(limit));
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load history', error: err.message });
  }
});

// Reminder effectiveness & monthly breakdown
router.get('/stats', auth, async (req, res) => {
  try {
    const reminders = await Reminder.find({ user_id: req.user.id }).select('sent createdAt sendAt');
    const total = reminders.length;
    const onTime = reminders.filter(r => r.sent && r.sendAt && r.createdAt && r.sendAt >= r.createdAt).length;
    const effectiveness = total > 0 ? Math.round((onTime / total) * 100) : 0;

    const byMonth = {};
    reminders.forEach(r => {
      const d = r.sendAt || r.createdAt || new Date();
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}`;
      byMonth[key] = (byMonth[key] || 0) + 1;
    });
    res.json({ total, onTime, effectiveness, monthly: byMonth });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load stats', error: err.message });
  }
});

// No transport test endpoint (in-app only)

module.exports = router;


