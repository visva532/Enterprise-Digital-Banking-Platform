import { useState } from "react";
import { useAuth } from "../lib/AuthContext.jsx";
import { adminApi } from "../lib/api.js";
import { useAsync } from "../lib/useAsync.js";
import { formatAccountNumber, formatINR } from "../lib/format.js";
import AsyncView from "./AsyncView.jsx";
import DataTable from "./DataTable.jsx";
import Icon from "./Icon.jsx";
import StatusBadge from "./StatusBadge.jsx";

export default function MoneyDashboard() {
  const { user } = useAuth();
  const token = user.token;

  const dash = useAsync(() => adminApi.dashboard(token), [token]);
  const [deposit, setDeposit] = useState({ accountNumber: "", amount: "", description: "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const d = dash.data;
  const max = d
    ? Math.max(1, ...d.last7Days.flatMap((day) => [Number(day.credits), Number(day.debits)]))
    : 1;

  const submitDeposit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!/^\d{12}$/.test(deposit.accountNumber)) return setError("Enter the 12-digit account number.");
    if (!(Number(deposit.amount) >= 1)) return setError("Enter an amount of at least 1.");
    setBusy(true);
    try {
      const txn = await adminApi.demoDeposit(token, {
        accountNumber: deposit.accountNumber,
        amount: Number(deposit.amount),
        description: deposit.description.trim() || undefined,
      });
      setMessage(`Deposited ${formatINR(txn.amount)}. Reference ${txn.reference}.`);
      setDeposit({ accountNumber: "", amount: "", description: "" });
      dash.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <AsyncView loading={dash.loading && !d} error={dash.error} onRetry={dash.reload}>
        {d && (
          <>
            <div className="stat-grid">
              <Stat label="Total deposits" value={formatINR(d.totalDeposits)} />
              <Stat label="Credits today" value={formatINR(d.creditsToday)} />
              <Stat label="Debits today" value={formatINR(d.debitsToday)} />
              <Stat label="Transactions today" value={d.transactionsToday} />
              <Stat label="Customers with accounts" value={d.totalCustomers} />
              <Stat label="Active accounts" value={d.activeAccounts} />
              <Stat label="Frozen" value={d.frozenAccounts} />
              <Stat label="Blocked" value={d.blockedAccounts} />
              <Stat label="Closed" value={d.closedAccounts} />
            </div>

            <div className="panel detail-card">
              <h3>Money flow, last 7 days</h3>
              <div className="flow-legend">
                <span className="dot credit" /> Credits <span className="dot debit" /> Debits
              </div>
              <div className="flow-chart">
                {d.last7Days.map((day) => (
                  <div className="flow-day" key={day.date}>
                    <div className="flow-bars">
                      <div
                        className="flow-bar credit"
                        style={{ height: `${(Number(day.credits) / max) * 100}%` }}
                        title={`Credits ${formatINR(day.credits)}`}
                      />
                      <div
                        className="flow-bar debit"
                        style={{ height: `${(Number(day.debits) / max) * 100}%` }}
                        title={`Debits ${formatINR(day.debits)}`}
                      />
                    </div>
                    <span className="flow-label">{day.date.slice(5)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel detail-card">
              <h3>Top accounts by balance</h3>
              <DataTable
                columns={[
                  { key: "accountNumber", label: "Account number", render: (a) => formatAccountNumber(a.accountNumber) },
                  { key: "fullName", label: "Holder" },
                  { key: "status", label: "Status", render: (a) => <StatusBadge value={a.status} /> },
                  { key: "balance", label: "Balance", render: (a) => formatINR(a.balance) },
                ]}
                rows={d.topAccounts}
                empty="No accounts yet."
              />
            </div>
          </>
        )}
      </AsyncView>

      <div className="panel detail-card">
        <h3>Demo deposit</h3>
        <p className="note">
          Demo tool: adds money to an account so the dashboard and transaction history have data. Real deposits,
          withdrawals and transfers come with the payments module.
        </p>
        {error && (
          <div className="notice error" role="alert">
            <Icon name="alert" size={18} />
            {error}
          </div>
        )}
        {message && <div className="notice success">{message}</div>}
        <form className="inline-form" onSubmit={submitDeposit}>
          <input
            placeholder="12-digit account number"
            inputMode="numeric"
            maxLength={12}
            value={deposit.accountNumber}
            onChange={(e) => setDeposit({ ...deposit, accountNumber: e.target.value.replace(/\D/g, "") })}
          />
          <input
            placeholder="Amount"
            inputMode="decimal"
            value={deposit.amount}
            onChange={(e) => setDeposit({ ...deposit, amount: e.target.value.replace(/[^\d.]/g, "") })}
          />
          <input
            placeholder="Description (optional)"
            value={deposit.description}
            onChange={(e) => setDeposit({ ...deposit, description: e.target.value })}
          />
          <button type="submit" className="btn btn-primary" disabled={busy}>
            Deposit
          </button>
        </form>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="panel stat">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
    </div>
  );
}