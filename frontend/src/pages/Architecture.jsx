import { useState } from "react";
import PageHead from "../components/PageHead.jsx";

const services = [
  { id: "account", name: "Account Service", sub: "Accounts and balances", does: ["Opens, freezes and closes accounts", "Commits deposits and withdrawals as single transactions", "Keeps balances in Redis in step with PostgreSQL", "Generates statements"], owns: "Account, Transaction" },
  { id: "customer", name: "Customer Service", sub: "Profiles and KYC status", does: ["Stores customer profiles and contact details", "Holds each customer's KYC status", "Links a customer to their accounts"], owns: "Customer, KYC" },
  { id: "payment", name: "Payment Service", sub: "Transfers and beneficiaries", does: ["Takes IMPS, NEFT and UPI transfers", "Verifies beneficiaries", "Calls the Fraud Service before debiting", "Runs the transfer saga and refunds on failure"], owns: "Payment, Beneficiary" },
  { id: "loan", name: "Loan Service", sub: "Lending", does: ["Takes applications and runs credit checks", "Calculates EMIs and builds the schedule", "Runs the disbursement saga", "Classifies overdue loans"], owns: "Loan" },
];

const infra = [
  { n: "Kafka", d: "Carries events between services in order, such as PaymentInitiated and LoanDisbursed." },
  { n: "PostgreSQL", d: "The system of record for accounts, transactions, loans and payments." },
  { n: "Redis", d: "Caches balances so reads are fast." },
  { n: "Keycloak", d: "Handles sign-in and roles." },
  { n: "Docker and Kubernetes", d: "Package each service and run them together." },
  { n: "Spring Cloud Gateway", d: "Single entry point that validates tokens, applies rate limits and routes requests." },
];

const stack = [
  ["Web client", "React"],
  ["Backend", "Java 25 with Spring Boot 4"],
  ["Database", "PostgreSQL"],
  ["Cache", "Redis"],
  ["Events", "Kafka"],
  ["Identity", "Keycloak"],
  ["Packaging", "Docker and Kubernetes"],
];

export default function Architecture() {
  const [sel, setSel] = useState("account");
  const s = services.find((x) => x.id === sel);
  return (
    <>
      <PageHead
        title="Architecture"
        lead="Separate services own separate parts of the bank. They talk through events, so one busy service does not hold up the rest."
      />
      <section className="block">
        <div className="container">
          <div className="block-head"><h2>Core services</h2><p>Select a service to see what it is responsible for.</p></div>
          <div className="grid-3 grid-4" role="group" aria-label="Services">
            {services.map((x) => (
              <button key={x.id} type="button" className="svc-btn" aria-pressed={sel === x.id} onClick={() => setSel(x.id)}>
                <span className="nm">{x.name}</span>
                <span className="sb">{x.sub}</span>
              </button>
            ))}
          </div>
          <div className="panel detail" aria-live="polite" style={{ marginTop: 16, maxWidth: 720 }}>
            <h3>{s.name}</h3>
            <ul style={{ listStyle: "disc", paddingLeft: 20, display: "grid", gap: 6, marginTop: 8 }}>
              {s.does.map((d) => (<li key={d} style={{ display: "list-item" }}>{d}</li>))}
            </ul>
            <p style={{ marginTop: 14 }}>Owns data for: <strong style={{ color: "var(--ink)" }}>{s.owns}</strong></p>
          </div>
          <p className="note">KYC, Fraud, Notification and Audit run as supporting services and respond to the same events.</p>
        </div>
      </section>

      <section className="block">
        <div className="container">
          <div className="block-head"><h2>What connects them</h2></div>
          <div className="grid-3">
            {infra.map((x) => (
              <div key={x.n} className="item"><h3>{x.n}</h3><p>{x.d}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className="block">
        <div className="container">
          <div className="block-head"><h2>Technology</h2></div>
          <dl className="stack" style={{ maxWidth: 640 }}>
            {stack.map(([k, v]) => (
              <div key={k} style={{ display: "contents" }}><dt>{k}</dt><dd>{v}</dd></div>
            ))}
          </dl>
        </div>
      </section>
    </>
  );
}
