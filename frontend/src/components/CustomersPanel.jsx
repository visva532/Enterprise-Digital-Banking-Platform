import { useState } from "react";
import { useAuth } from "../lib/AuthContext.jsx";
import { staffApi } from "../lib/api.js";
import { useAsync } from "../lib/useAsync.js";
import { formatAccountNumber, formatINR } from "../lib/format.js";
import AsyncView from "./AsyncView.jsx";
import DataTable from "./DataTable.jsx";
import StatusBadge from "./StatusBadge.jsx";

export default function CustomersPanel() {
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null);

  const customers = useAsync(() => staffApi.customers(user.token, q), [user.token, q]);

  const onSearch = (e) => {
    e.preventDefault();
    setQ(input.trim());
    setSelected(null);
  };

  const columns = [
    { key: "fullName", label: "Name", render: (c) => c.fullName || "(profile incomplete)" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone", render: (c) => c.phone || "-" },
    { key: "city", label: "City", render: (c) => c.city || "-" },
    { key: "kycStatus", label: "KYC", render: (c) => <StatusBadge value={c.kycStatus} /> },
  ];

  return (
    <div>
      <form className="inline-form" onSubmit={onSearch}>
        <input
          type="search"
          placeholder="Search by name, email or phone"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" className="btn btn-primary">
          Search
        </button>
      </form>

      <AsyncView loading={customers.loading} error={customers.error} onRetry={customers.reload}>
        <DataTable
          columns={columns}
          rows={customers.data}
          selectedId={selected?.id}
          onRowClick={setSelected}
          empty="No customers found."
        />
      </AsyncView>

      {selected && <CustomerDetail customer={selected} token={user.token} />}
    </div>
  );
}

function CustomerDetail({ customer, token }) {
  const accounts = useAsync(() => staffApi.accounts(token, customer.email), [token, customer.email]);
  const mine = (accounts.data || []).filter((a) => a.email === customer.email);

  return (
    <div className="panel detail-card">
      <h3>{customer.fullName || customer.email}</h3>
      <dl className="account-facts">
        <div><dt>Email</dt><dd>{customer.email}</dd></div>
        <div><dt>Phone</dt><dd>{customer.phone || "-"}</dd></div>
        <div><dt>Date of birth</dt><dd>{customer.dateOfBirth || "-"}</dd></div>
        <div>
          <dt>Address</dt>
          <dd>
            {[customer.addressLine, customer.city, customer.state, customer.pincode].filter(Boolean).join(", ") || "-"}
          </dd>
        </div>
        <div><dt>KYC status</dt><dd><StatusBadge value={customer.kycStatus} /></dd></div>
      </dl>

      <h4>Bank accounts</h4>
      <AsyncView loading={accounts.loading} error={accounts.error} onRetry={accounts.reload}>
        <DataTable
          columns={[
            { key: "accountNumber", label: "Account number", render: (a) => formatAccountNumber(a.accountNumber) },
            { key: "accountType", label: "Type" },
            { key: "status", label: "Status", render: (a) => <StatusBadge value={a.status} /> },
            { key: "balance", label: "Balance", render: (a) => formatINR(a.balance) },
          ]}
          rows={mine}
          empty="This customer has not opened an account yet."
        />
      </AsyncView>
    </div>
  );
}