import { useState } from "react";
import PageHead from "../components/PageHead.jsx";
import Icon from "../components/Icon.jsx";

const roles = ["Teller", "Manager", "Admin"];
// values per role: Y = allowed, A = needs approval, N = not allowed
const perms = [
  { what: "View customer accounts and balances", v: ["Y", "Y", "Y"] },
  { what: "Submit a loan application", v: ["Y", "Y", "N"] },
  { what: "Approve a loan or a high value transfer", v: ["N", "Y", "N"] },
  { what: "Freeze or unfreeze an account", v: ["N", "Y", "Y"] },
  { what: "Read the audit log", v: ["N", "Y", "Y"] },
  { what: "Manage users and roles", v: ["N", "N", "Y"] },
];
const label = { Y: "Allowed", A: "Needs approval", N: "Not allowed" };

const pillars = [
  { icon: "user", t: "Sign in once, carry a token", d: "Keycloak authenticates users. The gateway checks the token and the role on every request before it reaches a service." },
  { icon: "check", t: "Approval for critical actions", d: "Actions with real consequences, such as approving a loan, need a second authorised person." },
  { icon: "lock", t: "An audit log nobody can edit", d: "Each banking action appends a record. Entries are only ever added, never changed or removed." },
  { icon: "security", t: "Built around PCI DSS", d: "Card and payment data handling is designed to follow PCI DSS requirements. Compliance is confirmed by assessment, not by a web page." },
];

export default function Security() {
  const [role, setRole] = useState(1);
  return (
    <>
      <PageHead
        title="Security"
        lead="Who can do what is decided by role, checked at the gateway, and written to a record that cannot be rewritten."
      />
      <section className="block">
        <div className="container">
          <div className="block-head">
            <h2>What each role can do</h2>
            <p>Select a role to highlight its column. These are the default permissions and can be adjusted in Keycloak.</p>
          </div>
          <div className="tabs" role="group" aria-label="Roles">
            {roles.map((r, k) => (
              <button key={r} type="button" className="tab" aria-pressed={role === k} onClick={() => setRole(k)}>{r}</button>
            ))}
          </div>
          <div className="table-wrap">
            <table className="perm-table">
              <thead>
                <tr>
                  <th scope="col">Action</th>
                  {roles.map((r, k) => (
                    <th key={r} scope="col" className={`c ${role === k ? "col-on" : ""}`}>{r}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {perms.map((p) => (
                  <tr key={p.what}>
                    <th scope="row" style={{ fontWeight: 500, background: "transparent", position: "static" }}>{p.what}</th>
                    {p.v.map((v, k) => (
                      <td key={k} className={`c ${role === k ? "col-on" : ""} ${v === "Y" ? "yes" : v === "A" ? "appr" : "no"}`}>
                        {v === "Y" ? <Icon name="check" size={18} title={label[v]} /> : v === "A" ? "Approval" : <span aria-label={label[v]}>None</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="note">Nobody can edit or delete an audit entry, whatever their role.</p>
        </div>
      </section>
      <section className="block">
        <div className="container">
          <div className="block-head"><h2>How access is protected</h2></div>
          <div className="grid-3 grid-2">
            {pillars.map((p) => (
              <div key={p.t} className="item">
                <Icon name={p.icon} style={{ color: "var(--brand)" }} />
                <h3 style={{ marginTop: 10 }}>{p.t}</h3>
                <p>{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
