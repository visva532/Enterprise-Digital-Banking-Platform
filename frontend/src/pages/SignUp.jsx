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
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const goToVerify = (email, fullName, phone) => {
    try {
      // Saved to Customer Service after the email is verified
      sessionStorage.setItem(PENDING_PROFILE_KEY, JSON.stringify({ email, fullName, phone }));
    } catch {
      // ignore: the profile can be completed later
    }
    navigate("/verify-email", { state: { email } });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const name = form.name.trim();
    const phone = form.phone.trim();
    const email = form.email.trim().toLowerCase();

    if (!name) return setError("Please enter your full name.");
    if (!PHONE_RE.test(phone)) return setError("Enter a valid 10-digit Indian mobile number.");
    if (!EMAIL_RE.test(email)) return setError("Please enter a valid email address.");
    if (!PASSWORD_RE.test(form.password)) {
      return setError("Password must be 8-64 characters with at least one letter and one number.");
    }
    if (form.password !== form.confirmPassword) return setError("Passwords do not match.");

    setLoading(true);
    try {
      await authApi.signUp(email, form.password);
      goToVerify(email, name, phone);
    } catch (err) {
      // 429 = an OTP was already sent a moment ago. The user can just enter it.
      if (err instanceof ApiError && err.status === 429) {
        goToVerify(email, name, phone);
        return;
      }
      setError(err.message || "Unable to create your account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHead title="Create Account" lead="Join FinCore Nexus digital banking." />

      <section className="block">
        <div className="container">
          <div className="panel form-card">
            <h2>Create your account</h2>

            {error && (
              <div className="notice error" role="alert">
                <Icon name="alert" size={18} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="signup-name">Full name</label>
                <input
                  id="signup-name"
                  name="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={handleChange}
                  autoComplete="name"
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="signup-phone">Mobile number</label>
                <input
                  id="signup-phone"
                  name="phone"
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={form.phone}
                  onChange={handleChange}
                  autoComplete="tel-national"
                  maxLength={10}
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="signup-email">Email address</label>
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
                <span className="hint">We will send a verification OTP to this email.</span>
              </div>

              <div className="field">
                <label htmlFor="signup-password">Password</label>
                <input
                  id="signup-password"
                  name="password"
                  type="password"
                  placeholder="At least 8 characters, with a letter and a number"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="signup-confirm">Confirm password</label>
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
                className="btn btn-primary"
                disabled={loading}
                style={{ marginTop: 12 }}
              >
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>

            <p className="note" style={{ marginTop: 18 }}>
              Already have an account? <Link to="/sign-in">Sign in</Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}