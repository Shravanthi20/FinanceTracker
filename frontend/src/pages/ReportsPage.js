import React, { Component } from "react";
import { reportAPI } from "../config/api";

class ReportsPage extends Component {
  state = {
    from: "",
    to: "",
    results: [],
    loading: false,
    msg: "",
  };

  handleChange = (e) => {
    this.setState({ [e.target.name]: e.target.value });
  };

  fetchInvoices = async () => {
    this.setState({ loading: true, msg: "" });
    const { from, to } = this.state;

    try {
      const res = await reportAPI.getFinancialReport({
        from: from || "",
        to: to || ""
      });
      const data = Array.isArray(res.data) ? res.data : [];

      // Calculate grandTotal if missing
      const withTotals = data.map((inv) => {
        let total = inv?.totals?.grandTotal;
        if (!total || total === 0) {
          if (Array.isArray(inv.items)) {
            total = inv.items.reduce(
              (sum, it) => sum + (it.price || 0) * (it.quantity || 0),
              0
            );
          } else {
            total = 0;
          }
        }
        return {
          ...inv,
          computedGrandTotal: total,
        };
      });

      this.setState({
        results: withTotals,
        msg: withTotals.length === 0 ? "No invoices found" : "",
      });
    } catch (err) {
      console.error("Fetch invoices failed", err);
      this.setState({ msg: "Fetch failed" });
    } finally {
      this.setState({ loading: false });
    }
  };

  downloadInvoicePDF = (id) => {
    if (!id) return alert("Invalid invoice ID");
    window.open(`/api/reports/invoice/${id}/pdf`, "_blank");
  };

  downloadSummaryCSV = async () => {
    const { from, to } = this.state;
    try {
      const response = await fetch(
        `/api/reports/summary/csv?from=${from || ""}&to=${to || ""}`
      );
      if (!response.ok) throw new Error('Failed to download CSV');
      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "summary.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download CSV failed", err);
      alert("Download failed");
    }
  };

  render() {
    const { from, to, results, loading, msg } = this.state;

    return (
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <style>{`
          .form-container {
            max-width: 600px;
            margin: 30px auto;
            padding: 20px;
            border-radius: 12px;
            background: #f9f9f9;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
            font-family: Arial, sans-serif;
          }

          .form-container h2 {
            margin-bottom: 20px;
            text-align: center;
            color: #333;
          }

          label {
            display: inline-block;
            margin-right: 10px;
            font-weight: 600;
            color: #444;
          }

          input[type="date"] {
            padding: 8px 10px;
            border: 1px solid #ccc;
            border-radius: 8px;
            font-size: 15px;
            margin-right: 10px;
          }

          input[type="date"]:focus {
            border-color: #007bff;
            outline: none;
          }

          button {
            background: #007bff;
            color: #fff;
            font-size: 15px;
            font-weight: 600;
            padding: 10px 15px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            transition: 0.2s;
            margin-right: 10px;
          }

          button:hover {
            background: #0056b3;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }

          th, td {
            border: 1px solid #ccc;
            padding: 8px;
            text-align: left;
          }

          th {
            background: #f1f1f1;
          }
        `}</style>

        <h2>Download Reports</h2>

        <div style={{ marginBottom: 10 }}>
          <label>From</label>
          <input
            type="date"
            name="from"
            value={from}
            onChange={this.handleChange}
          />
          <label>To</label>
          <input
            type="date"
            name="to"
            value={to}
            onChange={this.handleChange}
          />
          <button onClick={this.fetchInvoices} disabled={loading}>
            Search
          </button>
          <button
            onClick={this.downloadSummaryCSV}
            disabled={loading || results.length === 0}
          >
            Download CSV Summary
          </button>
        </div>

        {loading ? (
          <div>Loading...</div>
        ) : (
          <div>
            {msg && <div>{msg}</div>}
            {results.length > 0 && (
              <table>
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Grand Total</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((inv) => (
                    <tr key={inv._id}>
                      <td>{inv.invoiceNumber || "(no number)"}</td>
                      <td>₹{inv.computedGrandTotal?.toFixed(2) || 0}</td>
                      <td>
                        <button
                          onClick={() => this.downloadInvoicePDF(inv._id)}
                        >
                          Download PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    );
  }
}

export default ReportsPage;
