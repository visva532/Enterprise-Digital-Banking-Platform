import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import PageHead from "../components/PageHead.jsx";
import Icon from "../components/Icon.jsx";
import { useAuth } from "../lib/AuthContext.jsx";
import { authApi, ApiError } from "../lib/api.js";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignIn() {
  const { user, isAuthenticated, login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const successMessage = location.state?.message;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const cleanEmail = email.trim().toLowerCase();

    if (!EMAIL_RE.test(cleanEmail)) {
  setError("Please enter a valid email address.");
  return;
}
    if (!password.trim()) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    try {
      const auth = await authApi.signIn(cleanEmail, password);
      login(auth);
      navigate("/accounts");
    } catch (err) {
      // Account exists but the email was never verified: send a new OTP and go to the OTP screen
      if (err instanceof ApiError && err.status === 403 && /not verified/i.test(err.message)) {
        authApi.resendOtp(cleanEmail).catch(() => {});
        navigate("/verify-email", { state: { email: cleanEmail } });
        return;
      }
      setError(err.message || "Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
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
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 18,
                }}
              >
                <div className="user-badge">
                  <Icon name="user" size={18} />
                </div>

                <span className="tag">{user?.name || user?.email}</span>
              </div>

              <p style={{ marginBottom: 18, color: "var(--muted)" }}>
                Signed in as{" "}
                <strong style={{ color: "var(--ink)" }}>{user?.email}</strong>.
              </p>

              <div style={{ display: "grid", gap: 10 }}>
                <Link to="/accounts" className="btn btn-primary">
                  Go to Accounts
                  <Icon name="arrow" size={18} />
                </Link>

                <button type="button" className="btn btn-outline" onClick={logout}>
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
            {successMessage && <div className="notice success">{successMessage}</div>}

            {error && (
              <div className="notice error" role="alert">
                <Icon name="alert" size={18} />
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
                  autoComplete="email"
                  required
                  autoFocus
                />
                <span className="hint">Enter your registered email address.</span>
              </div>

              <div className="field">
                <label htmlFor="auth-password">Password</label>
                <input
                  id="auth-password"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <span className="hint">
                  <Link to="/forgot-password">Forgot password?</Link>
                </span>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !email.trim() || !password}
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
            </form>

            <p className="note" style={{ marginTop: 18 }}>
              Don't have an account? <Link to="/signup">Create an account</Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}