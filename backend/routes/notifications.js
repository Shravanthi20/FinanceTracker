const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Reminder = require('../models/Reminder');
const { sendNotification } = require('../utils/notification');

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

// Update current user's notification preferences
router.put('/preferences', auth, async (req, res) => {
  try {
    const { channel, emailEnabled, smsEnabled, phone, timezone } = req.body;
    if (channel === 'sms') {
      if (!smsEnabled) {
        return res.status(400).json({ message: 'Enable SMS to use SMS channel' });
      }
      if (!phone || !/^\+\d{7,15}$/.test(String(phone))) {
        return res.status(400).json({ message: 'Valid E.164 phone (e.g., +15551234567) is required for SMS' });
      }
    }
    const update = {
      'notificationPreferences.channel': channel,
      'notificationPreferences.emailEnabled': emailEnabled,
      'notificationPreferences.smsEnabled': smsEnabled,
      'notificationPreferences.phone': phone,
      'notificationPreferences.timezone': timezone,
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
    const { message, sendAt, channel } = req.body;
    const doc = await Reminder.create({ user_id: req.user.id, message, sendAt: new Date(sendAt), channel });
    res.status(201).json(doc);
  } catch (err) {
    res.status(400).json({ message: 'Failed to create reminder', error: err.message });
  }
});

// Test send notification now using current preferences
router.post('/test', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('email notificationPreferences');
    if (!user) return res.status(404).json({ message: 'User not found' });
    const prefs = user.notificationPreferences || {};
    const channel = prefs.channel || 'email';
    const phone = prefs.phone;
    if (channel === 'sms' && (!phone || !/^\+\d{7,15}$/.test(String(phone)))) {
      return res.status(400).json({ message: 'Valid phone required to test SMS' });
    }
    const result = await sendNotification({
      channel,
      email: user.email,
      phone,
      subject: 'Notification preferences test',
      text: 'This is a test notification from Finance Tracker.',
      html: '<p>This is a <b>test</b> notification from Finance Tracker.</p>',
    });
    res.json({ ok: true, channel, simulated: Boolean(result?.simulated), result });
  } catch (err) {
    res.status(500).json({ message: 'Failed to send test notification', error: err.message });
  }
});

module.exports = router;


