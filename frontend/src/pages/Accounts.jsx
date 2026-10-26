import { useState } from "react";
import { Link } from "react-router-dom";
import PageHead from "../components/PageHead.jsx";
import Icon from "../components/Icon.jsx";
import { useAuth } from "../lib/AuthContext.jsx";
import AccountStatusCard from "../components/AccountStatusCard.jsx";

const states = [
  { id: "pending", label: "Pending KYC", tone: "warn", text: "A customer has asked to open an account. It cannot hold money until identity checks pass.", rules: ["The request is recorded with the customer's details.", "KYC verification starts automatically.", "No deposits or withdrawals are allowed yet."], next: "Moves to Active when KYC is verified." },
  { id: "active", label: "Active", tone: "", text: "The account is open and can send and receive money.", rules: ["Every deposit and withdrawal is a single all-or-nothing transaction.", "The balance shown comes from a cache that is refreshed on each change.", "Statements can be generated at any time."], next: "Can be frozen or closed." },
  { id: "frozen", label: "Frozen", tone: "bad", text: "An authorised staff member has stopped activity on the account, for example during a compliance review.", rules: ["Debits and credits are blocked.", "The freeze, who did it and why are written to the audit log.", "The balance stays visible to staff."], next: "Can be unfrozen to return to Active, or closed." },
  { id: "closed", label: "Closed", tone: "", text: "The account has been shut down and keeps its history.", rules: ["No further transactions are possible.", "Past statements and the audit trail remain available.", "A closed account is not reopened. A new request starts again at Pending KYC."], next: "Final state." },
];

const features = [
  { t: "Balance that matches the ledger", d: "Balances are read from Redis for speed and refreshed after each committed change, so what you see agrees with PostgreSQL." },
  { t: "Transactions that finish or do not happen", d: "A transfer between two accounts either updates both sides or neither, so money is never lost halfway." },
  { t: "Statements on request", d: "Generate a statement for an account over a chosen period from recorded transactions." },
  { t: "Access by role", d: "Tellers, managers and admins each see and do only what their role allows, enforced through Keycloak." },
];

export default function Accounts() {
  const { user, isAuthenticated } = useAuth();
  const [sel, setSel] = useState("active");
  const s = states.find((x) => x.id === sel);
  return (
    <>
    <AccountStatusCard />
      <PageHead
        title="Accounts"
        lead="An account moves through a small set of states. Each state decides what is allowed, and every change is recorded."
      />
      {isAuthenticated && (
        <section className="block" style={{ paddingBottom: 0 }}>
          <div className="container">
            <div className="panel detail" style={{ borderLeft: "4px solid var(--brand)", maxWidth: 720 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                <div>
                  <span className="user-badge" style={{ marginBottom: 6 }}>
                    <Icon name="user" size={16} />
                    {user.role} Session
                  </span>
                  <h3 style={{ fontSize: "1.25rem", marginTop: 4 }}>
                    {user.name} ({user.email})
                  </h3>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span className="tag">KYC Verified</span>
                  <div style={{ fontSize: "1.45rem", fontWeight: 700, color: "var(--brand-dark)", marginTop: 4 }}>
                    INR 1,48,750.00
                  </div>
                  <span style={{ fontSize: ".85rem", color: "var(--muted)" }}>Live Redis balance</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
                <Link to="/payments" className="btn btn-primary" style={{ minHeight: 38, fontSize: ".9rem" }}>
                  Initiate transfer
                </Link>
                <Link to="/loans" className="btn btn-quiet" style={{ minHeight: 38, fontSize: ".9rem" }}>
                  Apply for loan
                </Link>
                <Link to="/kyc" className="btn btn-quiet" style={{ minHeight: 38, fontSize: ".9rem" }}>
                  View KYC documents
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}
      <section className="block">
        <div className="container">
          <div className="block-head">
            <h2>Account lifecycle</h2>
            <p>Select a state to see what it means.</p>
          </div>
          <div className="tabs" role="group" aria-label="Account states">
            {states.map((x) => (
              <button
                key={x.id}
                type="button"
                className={`state-btn ${x.tone}`}
                aria-pressed={sel === x.id}
                onClick={() => setSel(x.id)}
              >
                {x.label}
              </button>
            ))}
          </div>
          <div className="panel detail" aria-live="polite" style={{ maxWidth: 720 }}>
            <h3>{s.label}</h3>
            <p>{s.text}</p>
            <ul>
              {s.rules.map((r) => (
                <li key={r}><Icon name="check" size={18} /><span>{r}</span></li>
              ))}
            </ul>
            <p style={{ marginTop: 16, color: "var(--ink)", fontWeight: 600 }}>{s.next}</p>
          </div>
        </div>
      </section>

      <section className="block">
        <div className="container">
          <div className="block-head"><h2>What the Account Service guarantees</h2></div>
          <div className="grid-3 grid-2">
            {features.map((f) => (
              <div key={f.t} className="item">
                <h3>{f.t}</h3>
                <p>{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
