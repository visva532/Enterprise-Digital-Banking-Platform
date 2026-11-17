import { useAuth } from "../lib/AuthContext.jsx";
import { useAccounts } from "../lib/useAccounts.js";
import { useAsync } from "../lib/useAsync.js";
import { accountApi, paymentApi } from "../lib/api.js";
import { formatDateTime, formatINR } from "../lib/format.js";
import AsyncView from "./AsyncView.jsx";
import DataTable from "./DataTable.jsx";
import StatusBadge from "./StatusBadge.jsx";

export default function HistoryPanel() {
  const { user } = useAuth();
  const token = user.token;
  const { primaryAccount } = useAccounts();
  const accountId = primaryAccount?.id;

  const statement = useAsync(
    () => (accountId ? accountApi.transactions(token, accountId) : Promise.resolve([])),
    [token, accountId]
  );
  const payments = useAsync(() => paymentApi.list(token), [token]);

  const refresh = () => {
    statement.reload();
    payments.reload();
  };

  return (
    <div>
      <div className="inline-form">
        <button type="button" className="btn btn-outline" onClick={refresh}>
          Refresh
        </button>
      </div>

      <h3>Account statement</h3>
      <AsyncView loading={statement.loading && !statement.data} error={statement.error} onRetry={statement.reload}>
        <DataTable
          columns={[
            { key: "createdAt", label: "Date", render: (t) => formatDateTime(t.createdAt) },
            { key: "description", label: "Details", render: (t) => t.description || "-" },
            {
              key: "counterpartyName",
              label: "Other party",
              render: (t) =>
                t.counterpartyName
                  ? `${t.type === "CREDIT" ? "From" : "To"} ${t.counterpartyName} (${t.counterpartyAccount})`
                  : "-",
            },
            { key: "type", label: "Type", render: (t) => <StatusBadge value={t.type} /> },
            {
              key: "amount",
              label: "Amount",
              render: (t) => (
                <span className={t.type === "CREDIT" ? "amount-credit" : "amount-debit"}>
                  {t.type === "CREDIT" ? "+" : "-"}
                  {formatINR(t.amount)}
                </span>
              ),
            },
            { key: "balanceAfter", label: "Balance", render: (t) => formatINR(t.balanceAfter) },
            { key: "reference", label: "Reference" },
          ]}
          rows={statement.data}
          empty="No transactions yet."
        />
      </AsyncView>

      <h3 style={{ marginTop: 28 }}>My payment requests</h3>
      <AsyncView loading={payments.loading && !payments.data} error={payments.error} onRetry={payments.reload}>
        <DataTable
          columns={[
            { key: "createdAt", label: "Date", render: (p) => formatDateTime(p.createdAt) },
            { key: "toHolderName", label: "To", render: (p) => `${p.toHolderName} (${p.toAccountMasked})` },
            { key: "amount", label: "Amount", render: (p) => formatINR(p.amount) },
            { key: "mode", label: "Mode" },
            { key: "status", label: "Status", render: (p) => <StatusBadge value={p.status} /> },
            { key: "failureReason", label: "Note", render: (p) => p.failureReason || "-" },
            { key: "reference", label: "Reference" },
          ]}
          rows={payments.data}
          empty="You have not sent any payments yet."
        />
      </AsyncView>
    </div>
  );
}