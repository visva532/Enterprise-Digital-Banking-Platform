import { useState } from "react";
import PageHead from "../components/PageHead.jsx";
import Tabs from "../components/Tabs.jsx";
import CustomersPanel from "../components/CustomersPanel.jsx";
import AccountsPanel from "../components/AccountsPanel.jsx";
import { useAuth } from "../lib/AuthContext.jsx";

export default function TellerDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState("customers");

  return (
    <>
      <PageHead title="Teller desk" lead={`Signed in as ${user.name}`} />
      <section className="block">
        <div className="container">
          <Tabs
            active={tab}
            onChange={setTab}
            tabs={[
              { key: "customers", label: "Customer search" },
              { key: "accounts", label: "Accounts and transactions" },
            ]}
          />
          {tab === "customers" && <CustomersPanel />}
          {tab === "accounts" && <AccountsPanel />}
        </div>
      </section>
    </>
  );
}