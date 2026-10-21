import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageHead from "../components/PageHead.jsx";
import Icon from "../components/Icon.jsx";
import { useAuth } from "../lib/AuthContext.jsx";

export default function SignUp() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "Customer"
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      // Demo-only registration.
      // Replace with your authentication API when available.
      const newUser = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        role: form.role
      };

      login(newUser);
      navigate("/accounts");
    } catch (err) {
      setError("Unable to create your account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHead
        title="Create Account"
        lead="Join FinCore Nexus digital banking."
      />

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
              </div>

              <div className="field">
                <label htmlFor="signup-password">Password</label>
                <input
                  id="signup-password"
                  name="password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
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

              <div className="field">
                <label htmlFor="signup-role">Account role</label>
                <select
                  id="signup-role"
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                >
                  <option value="Customer">Customer</option>
                </select>
                <span className="hint">
                  Staff roles must be assigned by an authorized administrator.
                </span>
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
              Already have an account?{" "}
              <Link to="/signin">Sign in</Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
