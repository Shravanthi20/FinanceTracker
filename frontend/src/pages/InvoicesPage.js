import React, { Component } from "react";
import { invoiceAPI } from "../config/api";

class InvoicesPage extends Component {
  state = {
    invoices: [],
    newInvoice: {
      title: "",
      items: [{ description: "", qty: 1, unitPrice: 0, taxPercent: 0, discountPercent: 0 }],
      dueDate: "",
      notes: "",
      user_id: "",
    },
    editingId: null,
    editedData: {},
    msg: "",
    error: false,
  };

  componentDidMount() {
    this.fetchInvoices();
  }

  // Fetch all invoices
  fetchInvoices = async () => {
    try {
      const res = await invoiceAPI.getAll();
      this.setState({ invoices: res.data });
    } catch (err) {
      console.error("Fetch invoices error", err);
    }
  };

  // Handle new invoice input
  handleNewChange = (e, idx = null, field = null) => {
    if (idx !== null && field !== null) {
      const items = [...this.state.newInvoice.items];
      items[idx][field] = e.target.value;
      this.setState({ newInvoice: { ...this.state.newInvoice, items } });
    } else {
      this.setState({ newInvoice: { ...this.state.newInvoice, [e.target.name]: e.target.value } });
    }
  };

  addItem = () => {
    this.setState({
      newInvoice: {
        ...this.state.newInvoice,
        items: [...this.state.newInvoice.items, { description: "", qty: 1, unitPrice: 0, taxPercent: 0, discountPercent: 0 }],
      },
    });
  };

  removeItem = (idx) => {
    const items = [...this.state.newInvoice.items];
    items.splice(idx, 1);
    this.setState({ newInvoice: { ...this.state.newInvoice, items } });
  };

  // --- Calculate totals
  calculateTotals = (items) => {
    let subtotal = 0, totalTax = 0, totalDiscount = 0;
    items.forEach((it) => {
      const qty = Number(it.qty) || 0;
      const price = Number(it.unitPrice) || 0;
      const tax = Number(it.taxPercent) || 0;
      const discount = Number(it.discountPercent) || 0;

      const lineTotal = qty * price;
      subtotal += lineTotal;
      totalTax += (lineTotal * tax) / 100;
      totalDiscount += (lineTotal * discount) / 100;
    });
    const grandTotal = subtotal + totalTax - totalDiscount;
    return { subtotal, totalTax, totalDiscount, grandTotal };
  };

  submitInvoice = async (e) => {
    e.preventDefault();
    try {
      const user_id = prompt("Enter your user_id");
      if (!user_id) return alert("user_id required");

      const totals = this.calculateTotals(this.state.newInvoice.items);
      const invoiceData = { ...this.state.newInvoice, user_id, totals };

      const res = await invoiceAPI.create(invoiceData);

      this.setState((prev) => ({
        invoices: [...prev.invoices, res.data],
        newInvoice: { title: "", items: [{ description: "", qty: 1, unitPrice: 0, taxPercent: 0, discountPercent: 0 }], dueDate: "", notes: "", user_id: "" },
        msg: "✅ Invoice added",
        error: false,
      }));
    } catch (err) {
      console.error(err);
      this.setState({ msg: err.response?.data?.error || "Failed", error: true });
    }
  };

  startEdit = (invoice) => {
    this.setState({ editingId: invoice._id, editedData: { ...invoice } });
  };

  handleEditChange = (e, idx = null, field = null) => {
    const { editedData } = this.state;
    if (idx !== null && field !== null) {
      const items = [...editedData.items];
      items[idx][field] = e.target.value;
      this.setState({ editedData: { ...editedData, items } });
    } else {
      this.setState({ editedData: { ...editedData, [e.target.name]: e.target.value } });
    }
  };

  saveEdit = async () => {
    try {
      const totals = this.calculateTotals(this.state.editedData.items);
      const updatedData = { ...this.state.editedData, totals };

      await invoiceAPI.update(this.state.editingId, updatedData);
      this.setState({ editingId: null, editedData: {} });
      this.fetchInvoices();
    } catch (err) {
      console.error("Update error", err);
    }
  };

  deleteInvoice = async (id) => {
    try {
      await invoiceAPI.delete(id);
      this.setState((prev) => ({ invoices: prev.invoices.filter((inv) => inv._id !== id) }));
    } catch (err) {
      console.error("Delete error", err);
    }
  };

  markPaid = async (id) => {
    try {
      const date = new Date().toISOString();
      const payment_method = prompt("Enter payment method (Cash/UPI/Card)");
      if (!payment_method) return;
      // Note: This endpoint might need to be added to the backend
      const response = await fetch(`/api/invoices/${id}/mark-paid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ date, payment_method })
      });
      if (!response.ok) throw new Error('Failed to mark invoice as paid');
      this.fetchInvoices();
    } catch (err) {
      console.error(err);
    }
  };

  downloadPDF = (id) => {
    window.open(`/api/reports/invoice/${id}/pdf`, "_blank");
  };

  render() {
    const { invoices, newInvoice, editingId, editedData, msg, error } = this.state;
    const totals = this.calculateTotals(newInvoice.items);

    return (
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <h2>Invoice Management</h2>
        {msg && <div className={error ? "error" : "success"}>{msg}</div>}

        <form onSubmit={this.submitInvoice} className="form-container">
          <h3>Create New Invoice</h3>

          <div className="form-group">
            <label>Title</label>
            <input name="title" value={newInvoice.title} onChange={this.handleNewChange} />
          </div>

          <div>
            <label>Items</label>
            {newInvoice.items.map((it, idx) => (
              <div key={idx} style={{ display: "flex", gap: "0.5rem", marginBottom: 4 }}>
                <input placeholder="Description" value={it.description} onChange={(e) => this.handleNewChange(e, idx, "description")} />
                <input type="number" placeholder="Qty" value={it.qty} onChange={(e) => this.handleNewChange(e, idx, "qty")} />
                <input type="number" placeholder="Unit Price" value={it.unitPrice} onChange={(e) => this.handleNewChange(e, idx, "unitPrice")} />
                <input type="number" placeholder="Tax %" value={it.taxPercent} onChange={(e) => this.handleNewChange(e, idx, "taxPercent")} />
                <input type="number" placeholder="Discount %" value={it.discountPercent} onChange={(e) => this.handleNewChange(e, idx, "discountPercent")} />
                <button type="button" onClick={() => this.removeItem(idx)}>Remove</button>
              </div>
            ))}
            <button type="button" onClick={this.addItem}>Add Item</button>
          </div>

          <div style={{ marginTop: 10 }}>
            <p>Subtotal: ₹{totals.subtotal}</p>
            <p>Tax: ₹{totals.totalTax}</p>
            <p>Discount: ₹{totals.totalDiscount}</p>
            <p><b>Grand Total: ₹{totals.grandTotal}</b></p>
          </div>

          <div className="form-group">
            <label>Due Date</label>
            <input type="date" name="dueDate" value={newInvoice.dueDate} onChange={this.handleNewChange} />
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea name="notes" value={newInvoice.notes} onChange={this.handleNewChange} />
          </div>

          <button type="submit">Save Invoice</button>
        </form>

        {/* LIST INVOICES */}
        <div className="card" style={{ marginTop: 20 }}>
          <h3>All Invoices</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Title</th>
                <th>Items</th>
                <th>Due</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length > 0 ? (
                invoices.map((inv) => (
                  <tr key={inv._id}>
                    <td>{inv.invoiceNumber || "-"}</td>
                    <td>{editingId === inv._id ? <input name="title" value={editedData.title} onChange={this.handleEditChange} /> : inv.title || "-"}</td>
                    <td>
                      {(editingId === inv._id ? editedData.items : inv.items || []).map((it, idx) => (
                        <div key={idx}>
                          {it.description} — {it.qty} × ₹{it.unitPrice} (Tax: {it.taxPercent}%, Disc: {it.discountPercent}%)
                        </div>
                      ))}
                    </td>
                    <td>{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "-"}</td>
                    <td>{inv.status || "Unpaid"}</td>
                    <td>
                      {editingId === inv._id ? <button onClick={this.saveEdit}>Save</button> : <button onClick={() => this.startEdit(inv)}>Edit</button>}
                      <button onClick={() => this.deleteInvoice(inv._id)}>Delete</button>
                      {inv.status !== "Paid" && <button onClick={() => this.markPaid(inv._id)}>Mark Paid</button>}
                      <button onClick={() => this.downloadPDF(inv._id)}>Download PDF</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "1rem" }}>No invoices yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}

export default InvoicesPage;
