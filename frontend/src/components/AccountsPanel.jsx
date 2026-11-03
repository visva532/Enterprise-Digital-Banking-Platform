import { useState } from "react";
import { useAuth } from "../lib/AuthContext.jsx";
import { staffApi } from "../lib/api.js";
import { useAsync } from "../lib/useAsync.js";
import { formatAccountNumber, formatINR } from "../lib/format.js";
import AsyncView from "./AsyncView.jsx";
import DataTable from "./DataTable.jsx";
import StatusBadge from "./StatusBadge.jsx";
import AccountDetail from "./AccountDetail.jsx";

export default function AccountsPanel({ canFreeze = false, canBlock = false, showAudit = false }) {
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const accounts = useAsync(() => staffApi.accounts(user.token, q, status), [user.token, q, status]);

  const onSearch = (e) => {
    e.preventDefault();
    setQ(input.trim());
    setSelectedId(null);
  };

  const columns = [
    { key: "accountNumber", label: "Account number", render: (a) => formatAccountNumber(a.accountNumber) },
    { key: "fullName", label: "Holder" },
    { key: "accountType", label: "Type" },
    { key: "status", label: "Status", render: (a) => <StatusBadge value={a.status} /> },
    { key: "balance", label: "Balance", render: (a) => formatINR(a.balance) },
  ];

  return (
    <div>
      <form className="inline-form" onSubmit={onSearch}>
        <input
          type="search"
          placeholder="Search by account number, name, email or mobile"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="FROZEN">Frozen</option>
          <option value="BLOCKED">Blocked</option>
          <option value="CLOSED">Closed</option>
        </select>
        <button type="submit" className="btn btn-primary">
          Search
        </button>
      </form>

      <AsyncView loading={accounts.loading} error={accounts.error} onRetry={accounts.reload}>
        <DataTable
          columns={columns}
          rows={accounts.data}
          selectedId={selectedId}
          onRowClick={(a) => setSelectedId(a.id)}
          empty="No accounts found."
        />
      </AsyncView>

      {selectedId && (
        <AccountDetail
          key={selectedId}
          accountId={selectedId}
          canFreeze={canFreeze}
          canBlock={canBlock}
          showAudit={showAudit}
          onChanged={accounts.reload}
        />
      )}
    </div>
  );
}