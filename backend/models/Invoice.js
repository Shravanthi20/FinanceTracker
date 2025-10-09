const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  qty: { type: Number, default: 1 },
  unitPrice: { type: Number, default: 0 },
  discountPercent: { type: Number, default: 0 },
  taxPercent: { type: Number, default: 0 },
});

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  user_id: { type: String, required: true },
  title: { type: String },
  items: [itemSchema],
  subtotal: { type: Number, default: 0 },
  totalTax: { type: Number, default: 0 },
  totalDiscount: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 },
  issueDate: { type: Date, default: Date.now },
  dueDate: { type: Date },
  notes: { type: String },
  status: { type: String, enum: ['Unpaid', 'Paid'], default: 'Unpaid' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Invoice', invoiceSchema);
