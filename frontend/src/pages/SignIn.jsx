import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import PageHead from "../components/PageHead.jsx";
import Icon from "../components/Icon.jsx";
import { useAuth } from "../lib/AuthContext.jsx";

const ROLES = ["Customer", "Bank Teller", "Manager", "Admin"];

export default function SignIn() {
  const { user, isAuthenticated, login, logout } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Customer");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    const authenticatedUser = {
      email: cleanEmail,
      role,
      name: cleanEmail.split("@")[0].replace(/[._]/g, " "),
      token: `fnc_${Math.random().toString(36).substring(2)}${Date.now()}`,
      signedInAt: new Date().toISOString(),
    };

    login(authenticatedUser);

    setTimeout(() => {
      navigate("/accounts");
    }, 400);
  };

  if (isAuthenticated) {
    return (
      <>
        <PageHead
          title="Sign in"
          lead="You are authenticated with FinCore Nexus."
        />
        <section className="block">
          <div className="container">
            <div className="panel form-card">
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                <div className="user-badge">
                  <Icon name="user" size={18} />
                  <span>{user.role}</span>
                </div>
                <span className="tag">{user.name || user.email}</span>
              </div>
              <p style={{ marginBottom: 18, color: "var(--muted)" }}>
                Signed in as <strong style={{ color: "var(--ink)" }}>{user.email}</strong>.
              </p>
              <div style={{ display: "grid", gap: 10 }}>
                <Link to="/accounts" className="btn btn-primary">
                  Go to Accounts
                  <Icon name="arrow" size={18} />
                </Link>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={logout}
                >
                  <Icon name="logout" size={18} />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <PageHead
        title="Sign in"
        lead="Sign in to your FinCore Nexus digital banking account."
      />
      <section className="block">
        <div className="container">
          <div className="panel form-card">
            {error && (
              <div className="notice error" role="alert">
                <Icon name="alert" size={18} style={{ marginRight: 6, verticalAlign: "middle" }} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="auth-email">Email address</label>
                <input
                  id="auth-email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
                <span className="hint">Enter your email to sign in directly.</span>
              </div>

              <div className="field">
                <label>Select role</label>
                <div className="role-chips" role="group" aria-label="Banking roles">
                  {ROLES.map((r) => (
                    <button
                      key={r}
                      type="button"
                      className="role-chip"
                      aria-pressed={role === r}
                      onClick={() => setRole(r)}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <span className="hint">Customer views accounts; Teller and Manager access operations.</span>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !email}
                style={{ marginTop: 12 }}
              >
                {loading ? (
                  "Signing in..."
                ) : (
                  <>
                    <Icon name="user" size={18} />
                    Sign in to FinCore Nexus
                  </>
                )}
              </button>

              <p className="note" style={{ marginTop: 18 }}>
                Staff roles (Teller, Manager, Admin) provide access to transaction oversight and approval queues.
              </p>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
