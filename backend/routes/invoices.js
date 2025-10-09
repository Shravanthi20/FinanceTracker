const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const generateInvoiceNumber = require('../utils/genInvoiceNumber');

// helper to calculate totals
function calcTotals(items = []) {
  let subtotal = 0, totalTax = 0, totalDiscount = 0;
  items.forEach(it => {
    const line = (Number(it.unitPrice) || 0) * (Number(it.qty) || 1);
    const disc = (Number(it.discountPercent) || 0) / 100 * line;
    const taxable = line - disc;
    const tax = (Number(it.taxPercent) || 0) / 100 * taxable;
    subtotal += line;
    totalDiscount += disc;
    totalTax += tax;
  });
  const grandTotal = subtotal - totalDiscount + totalTax;
  return { subtotal, totalTax, totalDiscount, grandTotal };
}

// CREATE invoice
router.post('/', async (req, res) => {
  try {
    const { user_id, items, title, dueDate, notes } = req.body;
    if (!user_id) return res.status(400).json({ error: 'user_id is required' });

    const invoiceNumber = generateInvoiceNumber();
    const totals = calcTotals(items || []);

    const invoice = new Invoice({
      invoiceNumber,
      user_id,
      title: title || '',
      items: items || [],
      subtotal: totals.subtotal,
      totalTax: totals.totalTax,
      totalDiscount: totals.totalDiscount,
      grandTotal: totals.grandTotal,
      issueDate: new Date(),
      dueDate: dueDate ? new Date(dueDate) : null,
      notes: notes || '',
      status: 'Unpaid',
      created_at: new Date(),
      updated_at: new Date()
    });

    await invoice.save();
    res.status(201).json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LIST invoices (by user_id)
router.get('/', async (req, res) => {
  try {
    const { user_id, status, from, to } = req.query;
    if (!user_id) return res.status(400).json({ error: 'user_id is required' });

    const query = { user_id };
    if (status) query.status = status;
    if (from || to) {
      query.issueDate = {};
      if (from) query.issueDate.$gte = new Date(from);
      if (to) query.issueDate.$lte = new Date(to);
    }

    const invoices = await Invoice.find(query).sort({ issueDate: -1 }).limit(200);
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single invoice
router.get('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE invoice
router.put('/:id', async (req, res) => {
  try {
    const payload = req.body;
    if (payload.items) {
      const totals = calcTotals(payload.items);
      payload.subtotal = totals.subtotal;
      payload.totalTax = totals.totalTax;
      payload.totalDiscount = totals.totalDiscount;
      payload.grandTotal = totals.grandTotal;
    }
    payload.updated_at = new Date();
    const updated = await Invoice.findByIdAndUpdate(req.params.id, payload, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE invoice
router.delete('/:id', async (req, res) => {
  try {
    await Invoice.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// MARK AS PAID -> creates Income record
router.post('/:id/mark-paid', async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    if (invoice.status === 'Paid') return res.status(400).json({ error: 'Already paid' });

    invoice.status = 'Paid';
    invoice.updated_at = new Date();
    await invoice.save();

    const income = new Income({
      user_id: invoice.user_id,
      sourceInvoice: invoice._id,
      date: req.body.date ? new Date(req.body.date) : new Date(),
      amount: invoice.grandTotal,
      source: req.body.source || 'Invoice Payment',
      payment_method: req.body.payment_method,
      notes: req.body.notes || `Payment for ${invoice.invoiceNumber}`
    });

    await income.save();
    res.json({ ok: true, invoice, income });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
