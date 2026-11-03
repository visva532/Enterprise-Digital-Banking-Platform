import { useState } from "react";
import PageHead from "../components/PageHead.jsx";
import AsyncView from "../components/AsyncView.jsx";
import DataTable from "../components/DataTable.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import Icon from "../components/Icon.jsx";
import { useAuth } from "../lib/AuthContext.jsx";
import { loanApi } from "../lib/api.js";
import { useAsync } from "../lib/useAsync.js";
import { formatDateTime, formatINR } from "../lib/format.js";

export default function MyLoans() {
  const { user } = useAuth();
  const token = user.token;

  const [form, setForm] = useState({
    applicantName: user?.name || "",
    loanType: "PERSONAL",
    amount: "",
    tenureMonths: "",
    monthlyIncome: "",
    purpose: "",
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const loans = useAsync(() => loanApi.mine(token), [token]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!form.applicantName.trim()) return setError("Please enter your full name.");
    if (!(Number(form.amount) >= 10000)) return setError("Minimum loan amount is 10,000.");
    const months = Number(form.tenureMonths);
    if (!(months >= 6 && months <= 360)) return setError("Tenure must be between 6 and 360 months.");
    if (!(Number(form.monthlyIncome) >= 1000)) return setError("Please enter your monthly income.");
    if (!form.purpose.trim()) return setError("Please enter the purpose of the loan.");

    setBusy(true);
    try {
      await loanApi.apply(token, {
        applicantName: form.applicantName.trim(),
        loanType: form.loanType,
        amount: Number(form.amount),
        tenureMonths: months,
        monthlyIncome: Number(form.monthlyIncome),
        purpose: form.purpose.trim(),
      });
      setMessage("Application submitted. A manager will review it.");
      setForm({ ...form, amount: "", tenureMonths: "", monthlyIncome: "", purpose: "" });
      loans.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHead title="My loans" lead="Apply for a loan and track the decision." />
      <section className="block">
        <div className="container">
          <div className="panel form-card">
            <h2>Apply for a loan</h2>
            {error && (
              <div className="notice error" role="alert">
                <Icon name="alert" size={18} />
                {error}
              </div>
            )}
            {message && <div className="notice success">{message}</div>}
            <form onSubmit={submit}>
              <div className="field-row">
                <div className="field">
                  <label htmlFor="loan-name">Full name</label>
                  <input id="loan-name" name="applicantName" value={form.applicantName} onChange={handleChange} required />
                </div>
                <div className="field">
                  <label htmlFor="loan-type">Loan type</label>
                  <select id="loan-type" name="loanType" value={form.loanType} onChange={handleChange}>
                    <option value="PERSONAL">Personal</option>
                    <option value="HOME">Home</option>
                    <option value="EDUCATION">Education</option>
                    <option value="VEHICLE">Vehicle</option>
                  </select>
                </div>
              </div>
              <div className="field-row">
                <div className="field">
                  <label htmlFor="loan-amount">Amount (INR)</label>
                  <input id="loan-amount" name="amount" inputMode="numeric" value={form.amount} onChange={handleChange} required />
                </div>
                <div className="field">
                  <label htmlFor="loan-tenure">Tenure (months)</label>
                  <input id="loan-tenure" name="tenureMonths" inputMode="numeric" value={form.tenureMonths} onChange={handleChange} required />
                </div>
              </div>
              <div className="field-row">
                <div className="field">
                  <label htmlFor="loan-income">Monthly income (INR)</label>
                  <input id="loan-income" name="monthlyIncome" inputMode="numeric" value={form.monthlyIncome} onChange={handleChange} required />
                </div>
                <div className="field">
                  <label htmlFor="loan-purpose">Purpose</label>
                  <input id="loan-purpose" name="purpose" maxLength={300} value={form.purpose} onChange={handleChange} required />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy ? "Submitting..." : "Submit application"}
              </button>
            </form>
          </div>

          <h3 style={{ marginTop: 28 }}>My applications</h3>
          <AsyncView loading={loans.loading && !loans.data} error={loans.error} onRetry={loans.reload}>
            <DataTable
              columns={[
                { key: "createdAt", label: "Applied", render: (l) => formatDateTime(l.createdAt) },
                { key: "loanType", label: "Type" },
                { key: "amount", label: "Amount", render: (l) => formatINR(l.amount) },
                { key: "tenureMonths", label: "Tenure", render: (l) => `${l.tenureMonths} months` },
                { key: "status", label: "Status", render: (l) => <StatusBadge value={l.status} /> },
                { key: "reviewRemarks", label: "Remarks", render: (l) => l.reviewRemarks || "-" },
              ]}
              rows={loans.data}
              empty="You have not applied for a loan yet."
            />
          </AsyncView>
        </div>
      </section>
    </>
  );
}