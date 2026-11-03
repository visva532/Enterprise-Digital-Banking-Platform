import { useState } from "react";
import { useAuth } from "../lib/AuthContext.jsx";
import { adminApi, staffApi } from "../lib/api.js";
import { useAsync } from "../lib/useAsync.js";
import { formatAccountNumber, formatDateTime, formatINR } from "../lib/format.js";
import AsyncView from "./AsyncView.jsx";
import DataTable from "./DataTable.jsx";
import Icon from "./Icon.jsx";
import StatusBadge from "./StatusBadge.jsx";

export default function AccountDetail({ accountId, canFreeze, canBlock, showAudit, onChanged }) {
  const { user } = useAuth();
  const token = user.token;

  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const detail = useAsync(async () => {
    const [account, transactions, audit] = await Promise.all([
      staffApi.account(token, accountId),
      staffApi.transactions(token, accountId),
      showAudit ? staffApi.audit(token, accountId) : Promise.resolve([]),
    ]);
    return { account, transactions, audit };
  }, [token, accountId, showAudit]);

  const { account: a, transactions, audit } = detail.data || {};

  const actions = [];
  if (a) {
    if (canFreeze && a.status === "ACTIVE")
      actions.push({ key: "freeze", label: "Freeze", done: "frozen", call: staffApi.freeze });
    if (canFreeze && a.status === "FROZEN")
      actions.push({ key: "unfreeze", label: "Unfreeze", done: "unfrozen", call: staffApi.unfreeze });
    if (canBlock && (a.status === "ACTIVE" || a.status === "FROZEN"))
      actions.push({ key: "block", label: "Block", done: "blocked", call: adminApi.block });
    if (canBlock && a.status === "BLOCKED")
      actions.push({ key: "unblock", label: "Unblock", done: "unblocked", call: adminApi.unblock });
    if (canBlock && a.status !== "CLOSED")
      actions.push({ key: "deactivate", label: "Deactivate", done: "deactivated", call: adminApi.deactivate });
  }

  const run = async (action) => {
    setError("");
    setMessage("");
    if (reason.trim().length < 5) {
      setError("Please enter a reason (at least 5 characters).");
      return;
    }
    setBusy(true);
    try {
      await action.call(token, accountId, reason.trim());
      setMessage(`Account ${action.done} successfully.`);
      setReason("");
      detail.reload();
      if (onChanged) onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="panel detail-card">
      <AsyncView loading={detail.loading && !a} error={detail.error} onRetry={detail.reload}>
        {a && (
          <>
            <h3>
              {a.fullName} <StatusBadge value={a.status} />
            </h3>
            <dl className="account-facts">
              <div><dt>Account number</dt><dd>{formatAccountNumber(a.accountNumber)}</dd></div>
              <div><dt>IFSC</dt><dd>{a.ifsc}</dd></div>
              <div><dt>Type</dt><dd>{a.accountType}</dd></div>
              <div><dt>Balance</dt><dd>{formatINR(a.balance)}</dd></div>
              <div><dt>Email</dt><dd>{a.email}</dd></div>
              <div><dt>Mobile</dt><dd>{a.mobile}</dd></div>
              <div><dt>Aadhaar</dt><dd>{a.aadhaarMasked}</dd></div>
              <div><dt>PAN</dt><dd>{a.panMasked}</dd></div>
              <div>
                <dt>Address</dt>
                <dd>{[a.addressLine, a.city, a.state, a.pincode].filter(Boolean).join(", ")}</dd>
              </div>
              <div><dt>Opened</dt><dd>{formatDateTime(a.openedAt)}</dd></div>
            </dl>

            {actions.length > 0 && (
              <div className="reason-box">
                <label htmlFor="reason">Reason (required, saved in the audit trail)</label>
                <textarea
                  id="reason"
                  rows={2}
                  maxLength={300}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="For example: customer reported a lost card"
                />
                {error && (
                  <div className="notice error" role="alert">
                    <Icon name="alert" size={18} />
                    {error}
                  </div>
                )}
                {message && <div className="notice success">{message}</div>}
                <div className="action-row">
                  {actions.map((action) => (
                    <button
                      key={action.key}
                      type="button"
                      className="btn btn-outline"
                      disabled={busy}
                      onClick={() => run(action)}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <h4>Transaction history</h4>
            <DataTable
              columns={[
                { key: "createdAt", label: "Date", render: (t) => formatDateTime(t.createdAt) },
                { key: "type", label: "Type", render: (t) => <StatusBadge value={t.type} /> },
                { key: "amount", label: "Amount", render: (t) => formatINR(t.amount) },
                { key: "balanceAfter", label: "Balance after", render: (t) => formatINR(t.balanceAfter) },
                { key: "description", label: "Description", render: (t) => t.description || "-" },
                { key: "reference", label: "Reference" },
              ]}
              rows={transactions}
              empty="No transactions yet."
            />

            {showAudit && (
              <>
                <h4>Status change history</h4>
                <DataTable
                  columns={[
                    { key: "createdAt", label: "When", render: (e) => formatDateTime(e.createdAt) },
                    { key: "action", label: "Action" },
                    { key: "actorEmail", label: "By", render: (e) => `${e.actorEmail} (${e.actorRole})` },
                    { key: "reason", label: "Reason" },
                  ]}
                  rows={audit}
                  empty="No status changes recorded."
                />
              </>
            )}
          </>
        )}
      </AsyncView>
    </div>
  );
}