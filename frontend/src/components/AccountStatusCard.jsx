import { Link } from "react-router-dom";
import Icon from "./Icon.jsx";
import { useAuth } from "../lib/AuthContext.jsx";
import { useAccounts } from "../lib/useAccounts.js";
import { formatAccountNumber, formatINR } from "../lib/format.js";

export default function AccountStatusCard() {
  const { isAuthenticated, user } = useAuth();
  const { primaryAccount, hasAccount, loading, error, reload } = useAccounts();

  if (!isAuthenticated) return null;

  if (loading) {
    return (
      <div className="panel account-card">
        <p className="note">Checking your account...</p>
      </div>
    );
  }

  // If the account service is down we say so, instead of wrongly suggesting a new account
  if (error) {
    return (
      <div className="panel account-card">
        <div className="notice error" role="alert">
          <Icon name="alert" size={18} />
          {error}
        </div>
        <button type="button" className="btn btn-outline" onClick={reload}>
          Try again
        </button>
      </div>
    );
  }

  if (!hasAccount) {
    return (
      <div className="panel account-card">
        <span className="tag">Action needed</span>
        <h3>Open your FinCore Nexus account</h3>
        <p style={{ color: "var(--muted)" }}>
          Hi {user?.name || user?.email}, you are signed in but do not have a bank account yet.
          Open one to unlock:
        </p>
        <ul className="account-perks">
          <li>Send money with IMPS, NEFT and UPI</li>
          <li>Apply for home and personal loans</li>
          <li>Statements, beneficiaries and KYC status</li>
        </ul>
        <Link to="/open-account" className="btn btn-primary">
          Open an account
          <Icon name="arrow" size={18} />
        </Link>
        <p className="note" style={{ marginTop: 12 }}>
          Keep your Aadhaar number, the mobile number linked to it, your PAN and your address ready.
        </p>
      </div>
    );
  }

  return (
    <div className="panel account-card">
      <span className="tag">{primaryAccount.accountType} account</span>
      <h3>{primaryAccount.fullName}</h3>
      <dl className="account-facts">
        <div>
          <dt>Account number</dt>
          <dd>{formatAccountNumber(primaryAccount.accountNumber)}</dd>
        </div>
        <div>
          <dt>IFSC</dt>
          <dd>{primaryAccount.ifsc}</dd>
        </div>
        <div>
          <dt>Balance</dt>
          <dd>{formatINR(primaryAccount.balance)}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{primaryAccount.status}</dd>
        </div>
      </dl>
    </div>
  );
}