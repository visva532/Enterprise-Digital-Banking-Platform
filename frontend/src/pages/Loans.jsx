import { useMemo, useState } from "react";
import PageHead from "../components/PageHead.jsx";
import { site } from "../config.js";

const money = (n) =>
  new Intl.NumberFormat(site.locale, { style: "currency", currency: site.currency, maximumFractionDigits: 0 }).format(Math.round(n));

function schedule(P, annual, n) {
  const r = annual / 12 / 100;
  const emi = r === 0 ? P / n : (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  let bal = P;
  const rows = [];
  for (let m = 1; m <= n; m++) {
    const interest = bal * r;
    const principal = m === n ? bal : emi - interest;
    bal = Math.max(0, bal - principal);
    rows.push({ m, emi: principal + interest, principal, interest, bal });
  }
  return { emi, rows };
}

const stateFlow = [
  { id: "applied", label: "Applied", text: "The application is submitted by a teller with the amount, term and loan type." },
  { id: "assess", label: "Under assessment", text: "KYC status is read and a credit check is run with a credit bureau." },
  { id: "approved", label: "Approved", text: "The EMI and repayment schedule are calculated and the loan is marked approved.", },
  { id: "disb", label: "Disbursing", text: "A saga credits the principal to the customer's account, then registers an auto-debit mandate for EMIs. If a step fails, the loan returns to Approved." },
  { id: "active", label: "Active", text: "The loan is live and the next EMI date is set." },
  { id: "overdue", label: "Overdue", tone: "warn", text: "An EMI was missed. If the account stays past the NPA threshold it is classed as a non-performing asset." },
  { id: "closed", label: "Closed", text: "The final EMI is paid or the loan is foreclosed." },
  { id: "rejected", label: "Rejected", tone: "bad", text: "The credit score was too low, so the application ends here." },
];

export default function Loans() {
  const [P, setP] = useState(500000);
  const [rate, setRate] = useState(9);
  const [years, setYears] = useState(5);
  const [full, setFull] = useState(false);
  const [sel, setSel] = useState("applied");

  const n = years * 12;
  const valid = P > 0 && rate >= 0 && rate <= 40 && years >= 1 && years <= 30;
  const calc = useMemo(() => (valid ? schedule(P, rate, n) : null), [P, rate, n, valid]);
  const total = calc ? calc.emi * n : 0;
  const interest = calc ? total - P : 0;
  const pPct = total ? (P / total) * 100 : 100;
  const rows = calc ? (full ? calc.rows : calc.rows.slice(0, 12)) : [];
  const st = stateFlow.find((s) => s.id === sel);

  const num = (set) => (e) => set(e.target.value === "" ? 0 : Number(e.target.value));

  return (
    <>
      <PageHead
        title="Loans"
        lead="Try the repayment maths the Loan Service uses, then follow an application from first submission to closure."
      />

      <section className="block">
        <div className="container">
          <div className="block-head">
            <h2>EMI calculator</h2>
            <p>Change the figures to see the monthly instalment and how much of the total is interest.</p>
          </div>
          <div className="calc">
            <div>
              <div className="field">
                <label htmlFor="amt">Loan amount</label>
                <div className="field-row">
                  <input type="range" min="50000" max="5000000" step="10000" value={Math.min(Math.max(P, 50000), 5000000)} onChange={num(setP)} aria-label="Loan amount slider" />
                  <input id="amt" type="number" min="1" value={P || ""} onChange={num(setP)} aria-invalid={P <= 0} />
                </div>
                {P <= 0 && <span className="err">Enter an amount greater than zero.</span>}
              </div>
              <div className="field">
                <label htmlFor="rate">Interest rate per year (%)</label>
                <div className="field-row">
                  <input type="range" min="1" max="30" step="0.1" value={Math.min(Math.max(rate, 1), 30)} onChange={num(setRate)} aria-label="Interest rate slider" />
                  <input id="rate" type="number" min="0" max="40" step="0.1" value={rate} onChange={num(setRate)} aria-invalid={rate < 0 || rate > 40} />
                </div>
                {(rate < 0 || rate > 40) && <span className="err">Enter a rate between 0 and 40.</span>}
              </div>
              <div className="field">
                <label htmlFor="yrs">Term in years</label>
                <div className="field-row">
                  <input type="range" min="1" max="30" step="1" value={Math.min(Math.max(years, 1), 30)} onChange={num(setYears)} aria-label="Term slider" />
                  <input id="yrs" type="number" min="1" max="30" step="1" value={years || ""} onChange={num(setYears)} aria-invalid={years < 1 || years > 30} />
                </div>
                {(years < 1 || years > 30) && <span className="err">Enter a term between 1 and 30 years.</span>}
              </div>
            </div>

            <div className="panel result" aria-live="polite">
              {calc ? (
                <>
                  <div className="cap">Monthly EMI</div>
                  <div className="big">{money(calc.emi)}</div>
                  <div className="split" aria-hidden="true">
                    <span className="p" style={{ width: `${pPct}%` }} />
                    <span className="i" style={{ width: `${100 - pPct}%` }} />
                  </div>
                  <div className="legend">
                    <span><i style={{ background: "var(--brand)" }} />Principal</span>
                    <span><i style={{ background: "#d9962f" }} />Interest</span>
                  </div>
                  <dl className="facts">
                    <div><dt>Principal</dt><dd>{money(P)}</dd></div>
                    <div><dt>Total interest</dt><dd>{money(interest)}</dd></div>
                    <div><dt>Total payable</dt><dd>{money(total)}</dd></div>
                    <div><dt>Number of EMIs</dt><dd>{n}</dd></div>
                  </dl>
                </>
              ) : (
                <p>Fix the highlighted fields to see a result.</p>
              )}
            </div>
          </div>
          <p className="note">This is an illustration using the standard reducing balance formula. A lender's final offer depends on its own rate, fees and credit assessment.</p>
        </div>
      </section>

      {calc && (
        <section className="block">
          <div className="container">
            <div className="block-head"><h2>Repayment schedule</h2></div>
            <div className="table-wrap" style={{ maxHeight: full ? 480 : "none", overflowY: "auto" }}>
              <table>
                <thead>
                  <tr><th scope="col">Month</th><th scope="col">EMI</th><th scope="col">Principal</th><th scope="col">Interest</th><th scope="col">Balance</th></tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.m}>
                      <td>{r.m}</td><td>{money(r.emi)}</td><td>{money(r.principal)}</td><td>{money(r.interest)}</td><td>{money(r.bal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {n > 12 && (
              <button type="button" className="btn btn-quiet" style={{ marginTop: 14 }} onClick={() => setFull((v) => !v)}>
                {full ? "Show first 12 months" : `Show all ${n} months`}
              </button>
            )}
          </div>
        </section>
      )}

      <section className="block">
        <div className="container">
          <div className="block-head">
            <h2>Loan lifecycle</h2>
            <p>Select a state to see what happens there.</p>
          </div>
          <div className="tabs" role="group" aria-label="Loan states">
            {stateFlow.map((s) => (
              <button key={s.id} type="button" className={`state-btn ${s.tone || ""}`} aria-pressed={sel === s.id} onClick={() => setSel(s.id)}>
                {s.label}
              </button>
            ))}
          </div>
          <div className="panel detail" aria-live="polite" style={{ maxWidth: 720 }}>
            <h3>{st.label}</h3>
            <p>{st.text}</p>
          </div>
        </div>
      </section>
    </>
  );
}
