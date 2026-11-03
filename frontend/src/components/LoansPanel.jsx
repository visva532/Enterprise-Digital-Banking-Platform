import { useState } from "react";
import { useAuth } from "../lib/AuthContext.jsx";
import { loanApi } from "../lib/api.js";
import { useAsync } from "../lib/useAsync.js";
import { formatDateTime, formatINR } from "../lib/format.js";
import AsyncView from "./AsyncView.jsx";
import DataTable from "./DataTable.jsx";
import Icon from "./Icon.jsx";
import StatusBadge from "./StatusBadge.jsx";

export default function LoansPanel() {
  const { user } = useAuth();
  const token = user.token;

  const [status, setStatus] = useState("PENDING");
  const [selected, setSelected] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loans = useAsync(() => loanApi.list(token, status), [token, status]);

  const decide = async (kind) => {
    setError("");
    setMessage("");
    if (kind === "reject" && remarks.trim().length < 5) {
      setError("Please give a reason for rejecting (at least 5 characters).");
      return;
    }
    setBusy(true);
    try {
      const call = kind === "approve" ? loanApi.approve : loanApi.reject;
      await call(token, selected.id, remarks.trim());
      setMessage(`Application ${kind === "approve" ? "approved" : "rejected"}.`);
      setSelected(null);
      setRemarks("");
      loans.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    { key: "applicantName", label: "Applicant" },
    { key: "loanType", label: "Type" },
    { key: "amount", label: "Amount", render: (l) => formatINR(l.amount) },
    { key: "tenureMonths", label: "Tenure", render: (l) => `${l.tenureMonths} months` },
    { key: "monthlyIncome", label: "Monthly income", render: (l) => formatINR(l.monthlyIncome) },
    { key: "status", label: "Status", render: (l) => <StatusBadge value={l.status} /> },
    { key: "createdAt", label: "Applied", render: (l) => formatDateTime(l.createdAt) },
  ];

  return (
    <div>
      <div className="inline-form">
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setSelected(null);
          }}
          aria-label="Filter by status"
        >
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="">All</option>
        </select>
      </div>

      {message && <div className="notice success">{message}</div>}

      <AsyncView loading={loans.loading} error={loans.error} onRetry={loans.reload}>
        <DataTable
          columns={columns}
          rows={loans.data}
          selectedId={selected?.id}
          onRowClick={(l) => {
            setSelected(l);
            setRemarks("");
            setError("");
            setMessage("");
          }}
          empty="No loan applications."
        />
      </AsyncView>

      {selected && (
        <div className="panel detail-card">
          <h3>
            {selected.applicantName} <StatusBadge value={selected.status} />
          </h3>
          <dl className="account-facts">
            <div><dt>Email</dt><dd>{selected.email}</dd></div>
            <div><dt>Loan type</dt><dd>{selected.loanType}</dd></div>
            <div><dt>Amount</dt><dd>{formatINR(selected.amount)}</dd></div>
            <div><dt>Tenure</dt><dd>{selected.tenureMonths} months</dd></div>
            <div><dt>Monthly income</dt><dd>{formatINR(selected.monthlyIncome)}</dd></div>
            <div><dt>Purpose</dt><dd>{selected.purpose}</dd></div>
            {selected.reviewedBy && (
              <div>
                <dt>Reviewed by</dt>
                <dd>{selected.reviewedBy}{selected.reviewRemarks ? `: ${selected.reviewRemarks}` : ""}</dd>
              </div>
            )}
          </dl>

          {selected.status === "PENDING" && (
            <div className="reason-box">
              <label htmlFor="remarks">Remarks (required when rejecting)</label>
              <textarea
                id="remarks"
                rows={2}
                maxLength={300}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
              {error && (
                <div className="notice error" role="alert">
                  <Icon name="alert" size={18} />
                  {error}
                </div>
              )}
              <div className="action-row">
                <button type="button" className="btn btn-primary" disabled={busy} onClick={() => decide("approve")}>
                  Approve
                </button>
                <button type="button" className="btn btn-outline" disabled={busy} onClick={() => decide("reject")}>
                  Reject
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}