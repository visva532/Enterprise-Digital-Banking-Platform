import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageHead from "../components/PageHead.jsx";
import Icon from "../components/Icon.jsx";
import { authApi } from "../lib/api.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d).{8,64}$/;

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState("email"); // "email" then "reset"
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const sendCode = async (e) => {
    e.preventDefault();
    setError("");

    const clean = email.trim().toLowerCase();
    if (!EMAIL_RE.test(clean)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      await authApi.forgotPassword(clean);
      setEmail(clean);
      setInfo("If an account exists for this email, an OTP has been sent. Enter it below.");
      setStep("reset");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setError("");

    if (!/^\d{6}$/.test(otp)) return setError("Enter the 6-digit OTP.");
    if (!PASSWORD_RE.test(newPassword)) {
      return setError("Password must be 8-64 characters with at least one letter and one number.");
    }
    if (newPassword !== confirm) return setError("Passwords do not match.");

    setLoading(true);
    try {
      await authApi.resetPassword(email, otp, newPassword);
      navigate("/signin", { state: { message: "Password reset successful. Please sign in." } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHead title="Reset password" lead="We will email you a one-time password." />

      <section className="block">
        <div className="container">
          <div className="panel form-card">
            {info && <div className="notice success">{info}</div>}
            {error && (
              <div className="notice error" role="alert">
                <Icon name="alert" size={18} />
                {error}
              </div>
            )}

            {step === "email" ? (
              <form onSubmit={sendCode}>
                <div className="field">
                  <label htmlFor="fp-email">Email address</label>
                  <input
                    id="fp-email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || !email.trim()}
                  style={{ marginTop: 12 }}
                >
                  {loading ? "Sending..." : "Send OTP"}
                </button>
              </form>
            ) : (
              <form onSubmit={resetPassword}>
                <div className="field">
                  <label htmlFor="fp-otp">6-digit OTP</label>
                  <input
                    id="fp-otp"
                    type="text"
                    inputMode="numeric"
                    placeholder="123456"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    required
                    autoFocus
                  />
                </div>

                <div className="field">
                  <label htmlFor="fp-new">New password</label>
                  <input
                    id="fp-new"
                    type="password"
                    placeholder="At least 8 characters, with a letter and a number"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor="fp-confirm">Confirm new password</label>
                  <input
                    id="fp-confirm"
                    type="password"
                    placeholder="Re-enter new password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
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
                  {loading ? "Resetting..." : "Reset password"}
                </button>

                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ marginTop: 10 }}
                  onClick={() => {
                    setStep("email");
                    setInfo("");
                    setError("");
                  }}
                >
                  Use a different email
                </button>
              </form>
            )}

            <p className="note" style={{ marginTop: 18 }}>
              <Link to="/signin">Back to sign in</Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}