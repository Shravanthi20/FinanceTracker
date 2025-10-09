const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');
const { stringify } = require('csv-stringify/sync');

const Invoice = require('../models/Invoice');
const Report = require('../models/Report');
const Expense = require('../models/Expense');

// ✅ Helper to calculate totals (handles price/unitPrice/amount and qty/quantity)
function computeTotals(inv) {
  let subtotal = 0, totalDiscount = 0, totalTax = 0;

  if (inv.items && inv.items.length > 0) {
    inv.items.forEach(it => {
      const price = it.unitPrice ?? it.price ?? it.amount ?? 0;
      const qty = it.qty ?? it.quantity ?? 1;

      const lineSubtotal = price * qty;
      const discount = it.discountPercent ? (lineSubtotal * it.discountPercent / 100) : 0;
      const tax = it.taxPercent ? ((lineSubtotal - discount) * it.taxPercent / 100) : 0;

      subtotal += lineSubtotal;
      totalDiscount += discount;
      totalTax += tax;
    });
  }

  inv.subtotal = parseFloat(subtotal.toFixed(2));
  inv.totalDiscount = parseFloat(totalDiscount.toFixed(2));
  inv.totalTax = parseFloat(totalTax.toFixed(2));
  inv.grandTotal = parseFloat((subtotal - totalDiscount + totalTax).toFixed(2));

  return inv;
}

// ✅ GET invoices with optional date/status filter
router.get('/invoices', async (req, res) => {
  try {
    const { from, to, status, user_id } = req.query;
    const query = {};
    if (user_id) query.user_id = user_id;
    if (status) query.status = status;
    if (from || to) {
      query.issueDate = {};
      if (from) query.issueDate.$gte = new Date(`${from}T00:00:00.000Z`);
      if (to) query.issueDate.$lte = new Date(`${to}T23:59:59.999Z`);
    }

    const invoices = await Invoice.find(query).sort({ issueDate: -1 }).limit(500);

    const enriched = invoices.map(doc => computeTotals(doc.toObject()));
    res.json(enriched);
  } catch (err) {
    console.error('Fetch invoices failed', err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ CSV summary download
router.get('/summary/csv', async (req, res) => {
  try {
    const { from, to, user_id } = req.query;
    const query = {};
    if (user_id) query.user_id = user_id;
    if (from || to) {
      query.issueDate = {};
      if (from) query.issueDate.$gte = new Date(`${from}T00:00:00.000Z`);
      if (to) query.issueDate.$lte = new Date(`${to}T23:59:59.999Z`);
    }

    const invoices = await Invoice.find(query).sort({ issueDate: -1 });
    const enriched = invoices.map(doc => computeTotals(doc.toObject()));

    const rows = enriched.map(i => ({
      invoiceNumber: i.invoiceNumber,
      title: i.title || '',
      date: i.issueDate ? new Date(i.issueDate).toISOString().slice(0,10) : '',
      amount: i.grandTotal,
      status: i.status
    }));

    const csv = stringify(rows, { header: true });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=summary.csv');
    res.send(csv);

    if (user_id) {
      await Report.create({
        user_id,
        type: 'csv_summary',
        meta: { from, to, count: invoices.length },
        file_url: null
      });
    }
  } catch (err) {
    console.error('CSV download failed', err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Invoice PDF download
router.get('/invoice/:id/pdf', async (req, res) => {
  try {
    const invDoc = await Invoice.findById(req.params.id);
    if (!invDoc) return res.status(404).json({ error: 'Invoice not found' });

    const inv = computeTotals(invDoc.toObject());
    const linkedExpenses = await Expense.find({ _id: { $in: inv.linkedExpenses || [] } });

    res.setHeader('Content-Type','application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=${inv.invoiceNumber}.pdf`);

    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);

    doc.fontSize(18).text('INVOICE', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Invoice: ${inv.invoiceNumber}`);
    doc.text(`Title: ${inv.title || '-'}`);
    doc.text(`Issue Date: ${new Date(inv.issueDate).toDateString()}`);
    if (inv.dueDate) doc.text(`Due Date: ${new Date(inv.dueDate).toDateString()}`);
    doc.moveDown();

    doc.fontSize(14).text('Items');
    inv.items.forEach((it, idx) => {
      const price = it.unitPrice ?? it.price ?? it.amount ?? 0;
      const qty = it.qty ?? it.quantity ?? 1;
      const lineTotal = price * qty;

      doc.fontSize(12).text(`${idx+1}. ${it.description} — ${qty} x ₹${price} = ₹${lineTotal.toFixed(2)}`);
      if (it.discountPercent) doc.text(`    Discount: ${it.discountPercent}%`);
      if (it.taxPercent) doc.text(`    Tax: ${it.taxPercent}%`);
      doc.moveDown(0.1);
    });

    if (linkedExpenses.length > 0) {
      doc.moveDown();
      doc.fontSize(14).text('Linked Expenses');
      linkedExpenses.forEach((ex, idx) => {
        doc.fontSize(12).text(`${idx+1}. ${ex.category} — ₹${ex.amount} (${ex.date.toDateString()})`);
      });
    }

    doc.moveDown();
    doc.fontSize(12).text(`Subtotal: ₹${inv.subtotal}`);
    doc.text(`Discount: ₹${inv.totalDiscount}`);
    doc.text(`Tax: ₹${inv.totalTax}`);
    doc.text(`Grand Total: ₹${inv.grandTotal}`);

    doc.end();

  } catch (err) {
    console.error('PDF download failed', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
