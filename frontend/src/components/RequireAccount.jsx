import { Link, Navigate } from "react-router-dom";
import PageHead from "./PageHead.jsx";
import Icon from "./Icon.jsx";
import { useAuth } from "../lib/AuthContext.jsx";
import { useAccounts } from "../lib/useAccounts.js";

export default function RequireAccount({ children }) {
  const { isAuthenticated } = useAuth();
  const { hasAccount, loading, error, reload } = useAccounts();

  if (!isAuthenticated) return <Navigate to="/signin" replace />;

  if (loading) {
    return (
      <section className="block">
        <div className="container">
          <p className="note">Checking your account...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="block">
        <div className="container">
          <div className="panel form-card">
            <div className="notice error" role="alert">
              <Icon name="alert" size={18} />
              {error}
            </div>
            <button type="button" className="btn btn-outline" onClick={reload}>
              Try again
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (!hasAccount) {
    return (
      <>
        <PageHead
          title="Open an account to continue"
          lead="Loans, payments and transfers are available once you have a FinCore Nexus account."
        />
        <section className="block">
          <div className="container">
            <div className="panel form-card">
              <p style={{ marginBottom: 18, color: "var(--muted)" }}>
                It takes about two minutes and needs your Aadhaar, PAN, address and an email OTP.
              </p>
              <Link to="/open-account" className="btn btn-primary">
                Open an account
                <Icon name="arrow" size={18} />
              </Link>
            </div>
          </div>
        </section>
      </>
    );
  }

  return children;
}