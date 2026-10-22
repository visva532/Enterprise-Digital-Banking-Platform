import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate, Link } from "react-router-dom";
import PageHead from "../components/PageHead.jsx";
import Icon from "../components/Icon.jsx";
import { useAuth } from "../lib/AuthContext.jsx";
import { authApi, customerApi } from "../lib/api.js";
import { PENDING_PROFILE_KEY } from "./SignUp.jsx";

// Saves the name and phone typed on the sign-up form. Never blocks login if it fails.
async function savePendingProfile(token, email) {
  try {
    const raw = sessionStorage.getItem(PENDING_PROFILE_KEY);
    if (!raw) return;
    const pending = JSON.parse(raw);
    if (pending.email !== email) return;
    await customerApi.updateMe(token, { fullName: pending.fullName, phone: pending.phone });
  } catch {
    // Customer Service may be down. The user can complete the profile later.
  } finally {
    sessionStorage.removeItem(PENDING_PROFILE_KEY);
  }
}

export default function VerifyEmail() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const email = state?.email || "";

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(60);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  if (!email) return <Navigate to="/signup" replace />;

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the 6-digit OTP.");
      return;
    }

    setLoading(true);
    try {
      const auth = await authApi.verifyOtp(email, otp);
      await savePendingProfile(auth.accessToken, email);
      login(auth);
      navigate("/accounts");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setInfo("");
    try {
      await authApi.resendOtp(email);
      setInfo("A new OTP has been sent to your email.");
      setCooldown(60);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <PageHead title="Verify your email" lead="Enter the OTP we sent to your email address." />

      <section className="block">
        <div className="container">
          <div className="panel form-card">
            <p style={{ marginBottom: 18, color: "var(--muted)" }}>
              OTP sent to <strong style={{ color: "var(--ink)" }}>{email}</strong>. It is valid for 5 minutes.
            </p>

            {info && <div className="notice success">{info}</div>}
            {error && (
              <div className="notice error" role="alert">
                <Icon name="alert" size={18} />
                {error}
              </div>
            )}

            <form onSubmit={handleVerify}>
              <div className="field">
                <label htmlFor="otp">6-digit OTP</label>
                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="123456"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  required
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || otp.length !== 6}
                style={{ marginTop: 12 }}
              >
                {loading ? "Verifying..." : "Verify and continue"}
              </button>
            </form>

            <button
              type="button"
              className="btn btn-outline"
              onClick={handleResend}
              disabled={cooldown > 0}
              style={{ marginTop: 10 }}
            >
              {cooldown > 0 ? `Resend OTP in ${cooldown}s` : "Resend OTP"}
            </button>

            <p className="note" style={{ marginTop: 18 }}>
              <Link to="/signin">Back to sign in</Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}