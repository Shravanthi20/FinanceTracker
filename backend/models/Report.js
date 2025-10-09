const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },
  group_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Groups', default: null },
  type: { type: String, enum: ['monthly_summary','category_breakdown','profit_loss','invoice_pdf','csv_summary'], default: 'monthly_summary' },
  file_url: { type: String, default: null },
  meta: { type: Object, default: {} },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Report', ReportSchema, 'Reports');
