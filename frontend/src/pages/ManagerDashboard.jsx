import { useState } from "react";
import PageHead from "../components/PageHead.jsx";
import Tabs from "../components/Tabs.jsx";
import LoansPanel from "../components/LoansPanel.jsx";
import CustomersPanel from "../components/CustomersPanel.jsx";
import AccountsPanel from "../components/AccountsPanel.jsx";
import { useAuth } from "../lib/AuthContext.jsx";

export default function ManagerDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState("loans");

  return (
    <>
      <PageHead title="Manager console" lead={`Signed in as ${user.name}`} />
      <section className="block">
        <div className="container">
          <Tabs
            active={tab}
            onChange={setTab}
            tabs={[
              { key: "loans", label: "Loan applications" },
              { key: "accounts", label: "Accounts" },
              { key: "customers", label: "Customers" },
            ]}
          />
          {tab === "loans" && <LoansPanel />}
          {tab === "accounts" && <AccountsPanel canFreeze showAudit />}
          {tab === "customers" && <CustomersPanel />}
        </div>
      </section>
    </>
  );
}