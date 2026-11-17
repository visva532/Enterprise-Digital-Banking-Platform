
import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import PageHead from "../components/PageHead.jsx";
import Icon from "../components/Icon.jsx";
import { useAuth } from "../lib/AuthContext.jsx";
import { authApi, ApiError } from "../lib/api.js";
import { SIGN_IN_OPTIONS, homeForRole } from "../lib/roles.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignIn() {
  const { user, isAuthenticated, login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [loginAs, setLoginAs] = useState("CUSTOMER");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const successMessage = location.state?.message;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !EMAIL_RE.test(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password.trim()) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      const auth = await authApi.signIn(
        cleanEmail,
        password,
        loginAs
      );

      login(auth);
      navigate(homeForRole(auth.role));
    } catch (err) {
      if (
        err instanceof ApiError &&
        err.status === 403 &&
        /not verified/i.test(err.message)
      ) {
        authApi.resendOtp(cleanEmail).catch(() => {});

        navigate("/verify-email", {
          state: { email: cleanEmail }
        });

        return;
      }

      setError(
        err.message || "Unable to sign in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated) {
    const isCustomer = user?.role === "CUSTOMER";

    return (
      <main className="auth-page">
        <PageHead
          title="Welcome to FinCore Nexus"
          lead="You are authenticated with FinCore Nexus."
        />

        <section className="auth-section">
          <div className="container auth-container">
            <div className="panel form-card auth-card">
              <div className="auth-brand">
                <div className="auth-logo">
                  <Icon name="user" size={26} />
                </div>
                <span>FINCORE NEXUS</span>
              </div>

              <h2>Welcome back!</h2>

              <p className="auth-description">
                You are successfully signed in.
              </p>

              <div className="auth-user-info">
                <span className="tag">
                  {user?.name || user?.email}
                </span>

                <span className="tag">
                  {user?.role}
                </span>
              </div>

              <p className="auth-account-text">
                Signed in as{" "}
                <strong>{user?.email}</strong>
              </p>

              <div className="auth-actions">
                <Link
                  to={homeForRole(user?.role)}
                  className="btn btn-primary"
                >
                  {isCustomer
                    ? "Go to Accounts"
                    : "Open my dashboard"}

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
      </main>
    );
  }

  return (
    <main className="auth-page">
      <PageHead
        title="Sign in"
        lead="Sign in to your FinCore Nexus digital banking account."
      />

      <section className="auth-section">
        <div className="container auth-container">
          <div className="panel form-card auth-card">

            <div className="auth-brand">
              <div className="auth-logo">
                <Icon name="user" size={26} />
              </div>

              <span>FINCORE NEXUS</span>
            </div>

            <h2>Welcome Back</h2>

            <p className="auth-description">
              Sign in to access your digital banking account.
            </p>

            {successMessage && (
              <div className="notice success" role="status">
                {successMessage}
              </div>
            )}

            {error && (
              <div className="notice error" role="alert">
                <Icon name="alert" size={18} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>

              <div className="field">
                <label id="login-as-label">
                  Sign in as
                </label>

                <div
                  className="role-options"
                  role="radiogroup"
                  aria-labelledby="login-as-label"
                >
                  {SIGN_IN_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className={`role-option ${
                        loginAs === option.value ? "selected" : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="loginAs"
                        value={option.value}
                        checked={loginAs === option.value}
                        onChange={() => setLoginAs(option.value)}
                      />

                      {option.label}
                    </label>
                  ))}
                </div>

                {loginAs !== "CUSTOMER" && (
                  <span className="hint">
                    Staff accounts are created by a FinCore Nexus administrator.
                  </span>
                )}
              </div>

              <div className="field">
                <label htmlFor="auth-email">
                  Email address
                </label>

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

                <span className="hint">
                  Enter your registered email address.
                </span>
              </div>

              <div className="field">
                <label htmlFor="auth-password">
                  Password
                </label>

                <input
                  id="auth-password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />

                <span className="hint">
                  <Link to="/forgot-password">
                    Forgot password?
                  </Link>
                </span>
              </div>

              <button
                type="submit"
                className="btn btn-primary auth-submit"
                disabled={loading || !email.trim() || !password}
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

            {loginAs === "CUSTOMER" && (
              <p className="auth-footer-text">
                Don't have an account?{" "}
                <Link to="/signup">
                  Create an account
                </Link>
              </p>
            )}

          </div>
        </div>
      </section>
    </main>
  );
}
