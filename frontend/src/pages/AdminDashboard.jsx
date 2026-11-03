import { useState } from "react";
import PageHead from "../components/PageHead.jsx";
import Tabs from "../components/Tabs.jsx";
import MoneyDashboard from "../components/MoneyDashboard.jsx";
import CustomersPanel from "../components/CustomersPanel.jsx";
import AccountsPanel from "../components/AccountsPanel.jsx";
import EmployeesPanel from "../components/EmployeesPanel.jsx";
import { useAuth } from "../lib/AuthContext.jsx";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState("dashboard");

  return (
    <>
      <PageHead title="Admin console" lead={`Signed in as ${user.name}`} />
      <section className="block">
        <div className="container">
          <Tabs
            active={tab}
            onChange={setTab}
            tabs={[
              { key: "dashboard", label: "Money dashboard" },
              { key: "customers", label: "Customers" },
              { key: "accounts", label: "Accounts" },
              { key: "employees", label: "Employees" },
            ]}
          />
          {tab === "dashboard" && <MoneyDashboard />}
          {tab === "customers" && <CustomersPanel />}
          {tab === "accounts" && <AccountsPanel canFreeze canBlock showAudit />}
          {tab === "employees" && <EmployeesPanel />}
        </div>
      </section>
    </>
  );
}