const mongoose = require('mongoose');

const ReminderSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },
  message: { type: String, required: true },
  channel: { type: String, enum: ['email','sms'], default: 'email' },
  sendAt: { type: Date, required: true },
  sent: { type: Boolean, default: false },
  error: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Reminder', ReminderSchema, 'Reminders');


