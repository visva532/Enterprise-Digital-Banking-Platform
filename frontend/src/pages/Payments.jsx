import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import PageHead from "../components/PageHead.jsx";
import Tabs from "../components/Tabs.jsx";
import SendMoneyPanel from "../components/SendMoneyPanel.jsx";
import HistoryPanel from "../components/HistoryPanel.jsx";
import PayeesPanel from "../components/PayeesPanel.jsx";

const TABS = ["send", "history", "payees"];

export default function Payments() {
  const [params] = useSearchParams();
  const initial = TABS.includes(params.get("tab")) ? params.get("tab") : "send";
  const [tab, setTab] = useState(initial);

  return (
    <>
      <PageHead title="Payments" lead="Send money, review your statement and manage payees." />
      <section className="block">
        <div className="container">
          <Tabs
            active={tab}
            onChange={setTab}
            tabs={[
              { key: "send", label: "Send money" },
              { key: "history", label: "History" },
              { key: "payees", label: "Payees" },
            ]}
          />
          {tab === "send" && <SendMoneyPanel />}
          {tab === "history" && <HistoryPanel />}
          {tab === "payees" && <PayeesPanel />}
        </div>
      </section>
    </>
  );
}