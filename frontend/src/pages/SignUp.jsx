
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageHead from "../components/PageHead.jsx";
import Icon from "../components/Icon.jsx";
import { authApi, ApiError } from "../lib/api.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d).{8,64}$/;
const PHONE_RE = /^[6-9]\d{9}$/;

export const PENDING_PROFILE_KEY = "fincore_pending_profile";

export default function SignUp() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const goToVerify = (email, fullName, phone) => {
    try {
      sessionStorage.setItem(
        PENDING_PROFILE_KEY,
        JSON.stringify({
          email,
          fullName,
          phone,
        })
      );
    } catch {
      // Profile can be completed later if storage is unavailable.
    }

    navigate("/verify-email", {
      state: { email },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const name = form.name.trim();
    const phone = form.phone.trim();
    const email = form.email.trim().toLowerCase();

    if (!name) {
      setError("Please enter your full name.");
      return;
    }

    if (!PHONE_RE.test(phone)) {
      setError("Enter a valid 10-digit Indian mobile number.");
      return;
    }

    if (!EMAIL_RE.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!PASSWORD_RE.test(form.password)) {
      setError(
        "Password must be 8-64 characters with at least one letter and one number."
      );
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await authApi.signUp(email, form.password);

      goToVerify(email, name, phone);
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        goToVerify(email, name, phone);
        return;
      }

      setError(
        err.message ||
        "Unable to create your account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <PageHead
        title="Create Account"
        lead="Join FinCore Nexus digital banking."
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

            <h2>Create Your Account</h2>

            <p className="auth-description">
              Register to get started with secure digital banking.
            </p>

            {error && (
              <div className="notice error" role="alert">
                <Icon name="alert" size={18} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>

              <div className="field">
                <label htmlFor="signup-name">
                  Full name
                </label>

                <input
                  id="signup-name"
                  name="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={handleChange}
                  autoComplete="name"
                  maxLength={100}
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="signup-phone">
                  Mobile number
                </label>

                <input
                  id="signup-phone"
                  name="phone"
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={form.phone}
                  onChange={handleChange}
                  autoComplete="tel-national"
                  maxLength={10}
                  inputMode="numeric"
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="signup-email">
                  Email address
                </label>

                <input
                  id="signup-email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                />

                <span className="hint">
                  We will send a verification OTP to this email.
                </span>
              </div>

              <div className="field">
                <label htmlFor="signup-password">
                  Password
                </label>

                <input
                  id="signup-password"
                  name="password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={64}
                  required
                />

                <span className="hint">
                  Must contain at least one letter and one number.
                </span>
              </div>

              <div className="field">
                <label htmlFor="signup-confirm">
                  Confirm password
                </label>

                <input
                  id="signup-confirm"
                  name="confirmPassword"
                  type="password"
                  placeholder="Re-enter your password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary auth-submit"
                disabled={loading}
              >
                {loading ? (
                  "Creating account..."
                ) : (
                  <>
                    <Icon name="user" size={18} />
                    Create Account
                  </>
                )}
              </button>

            </form>

            <p className="auth-footer-text">
              Already have an account?{" "}
              <Link to="/sign-in">
                Sign in
              </Link>
            </p>

          </div>
        </div>
      </section>
    </main>
  );
}
