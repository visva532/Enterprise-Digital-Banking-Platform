import { useEffect, useRef, useState } from "react";
import { NavLink, Link, Outlet, useLocation } from "react-router-dom";
import Icon, { Logo } from "./Icon.jsx";
import { site } from "../config.js";
import { useAuth } from "../lib/AuthContext.jsx";

export const sections = [
  { to: "/accounts", label: "Accounts", icon: "accounts", blurb: "Open, hold and close accounts with a balance that is always in step with the ledger." },
  { to: "/payments", label: "Payments", icon: "payments", blurb: "Send money by IMPS, NEFT or UPI, with a fraud check first and a refund if anything fails." },
  { to: "/loans", label: "Loans", icon: "loans", blurb: "Apply, get assessed, and see exactly how a repayment schedule is worked out." },
  { to: "/kyc", label: "KYC", icon: "kyc", blurb: "Verify a customer with documents, a face match and a liveness check." },
  { to: "/security", label: "Security", icon: "security", blurb: "Role based access, approvals for critical actions and a log nobody can edit." },
  { to: "/architecture", label: "Architecture", icon: "architecture", blurb: "The services, events and data stores behind every screen." },
];

export default function Layout() {
  const { pathname } = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const main = useRef(null);
  const first = useRef(true);

  useEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
    if (first.current) {
      first.current = false;
    } else if (main.current) {
      main.current.focus({ preventScroll: true });
    }
  }, [pathname]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <header className="header">
        <div className="container header-row">
          <Link to="/" className="brand" aria-label={`${site.name} home`}>
            <Logo />
            <span>{site.name}</span>
          </Link>
          <nav className={`nav ${open ? "is-open" : ""}`} id="primary-nav" aria-label="Main">
            {sections.map((s) => (
              <NavLink key={s.to} to={s.to} className="nav-link">
                <Icon name={s.icon} size={18} />
                {s.label}
              </NavLink>
            ))}
            {isAuthenticated ? (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginLeft: 8 }}>
                <NavLink to="/sign-in" className="user-badge" title={`Signed in as ${user.email}`}>
                  <Icon name="user" size={16} />
                  <span>{user.name}</span>
                  <span className="tag" style={{ fontSize: ".75rem", padding: "1px 6px" }}>{user.role}</span>
                </NavLink>
                <button
                  type="button"
                  className="btn btn-quiet"
                  onClick={logout}
                  style={{ minHeight: 38, padding: "0 10px", fontSize: ".88rem" }}
                  title="Sign out"
                >
                  <Icon name="logout" size={16} />
                  <span>Sign out</span>
                </button>
              </div>
            ) : (
              <NavLink to="/sign-in" className="btn btn-primary nav-cta">
                Sign in
              </NavLink>
            )}
          </nav>
          <button
            type="button"
            className="menu-btn"
            aria-expanded={open}
            aria-controls="primary-nav"
            onClick={() => setOpen((v) => !v)}
          >
            <Icon name={open ? "x" : "menu"} />
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          </button>
        </div>
      </header>

      <main id="main" ref={main} tabIndex={-1} className="main">
        <div key={pathname} className="page">
          <Outlet />
        </div>
      </main>

      <footer className="footer">
        <div className="container footer-grid">
          <div>
            <Link to="/" className="brand" aria-label={`${site.name} home`}>
              <Logo size={28} />
              <span>{site.name}</span>
            </Link>
            <p className="footer-note">
              A digital banking platform for accounts, payments, loans and KYC.
            </p>
          </div>
          <nav aria-label="Platform">
            <h2 className="footer-h">Platform</h2>
            <ul>
              {sections.map((s) => (
                <li key={s.to}><Link to={s.to}>{s.label}</Link></li>
              ))}
            </ul>
          </nav>
          <nav aria-label="Legal">
            <h2 className="footer-h">Legal</h2>
            <ul>
              <li><Link to="/privacy">Privacy policy</Link></li>
              <li><Link to="/terms">Terms and conditions</Link></li>
              <li><Link to="/sign-in">Sign in</Link></li>
            </ul>
          </nav>
        </div>
        <div className="container footer-base">
          <p>&copy; {new Date().getFullYear()} {site.legalName || site.name}. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}
