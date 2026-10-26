import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import PageHead from "../components/PageHead.jsx";
import Icon from "../components/Icon.jsx";
import { useAuth } from "../lib/AuthContext.jsx";
import { useAccounts } from "../lib/useAccounts.js";
import { accountApi } from "../lib/api.js";
import { formatAccountNumber } from "../lib/format.js";

const AADHAAR_RE = /^[2-9]\d{11}$/;
const MOBILE_RE = /^[6-9]\d{9}$/;
const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const PINCODE_RE = /^\d{6}$/;

export default function OpenAccount() {
  const { user, isAuthenticated } = useAuth();
  const { hasAccount, loading: accountsLoading } = useAccounts();

  const [step, setStep] = useState("details"); // details, otp, done
  const [form, setForm] = useState({
    fullName: user?.name || "",
    aadhaarNumber: "",
    aadhaarMobile: "",
    panNumber: "",
    addressLine: "",
    city: "",
    state: "",
    pincode: "",
    accountType: "SAVINGS",
    consent: false,
  });
  const [application, setApplication] = useState(null);
  const [otp, setOtp] = useState("");
  const [created, setCreated] = useState(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  if (!isAuthenticated) return <Navigate to="/signin" replace />;

  if (!accountsLoading && hasAccount && step !== "done") {
    return (
      <>
        <PageHead title="Open an account" lead="You already have a FinCore Nexus account." />
        <section className="block">
          <div className="container">
            <div className="panel form-card">
              <Link to="/accounts" className="btn btn-primary">
                Go to Accounts
                <Icon name="arrow" size={18} />
              </Link>
            </div>
          </div>
        </section>
      </>
    );
  }

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    let next = type === "checkbox" ? checked : value;
    if (name === "aadhaarNumber") next = value.replace(/\D/g, "").slice(0, 12);
    if (name === "aadhaarMobile") next = value.replace(/\D/g, "").slice(0, 10);
    if (name === "pincode") next = value.replace(/\D/g, "").slice(0, 6);
    if (name === "panNumber") next = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
    setForm((f) => ({ ...f, [name]: next }));
  };

  const submitDetails = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!form.fullName.trim()) return setError("Please enter your full name as on Aadhaar.");
    if (!AADHAAR_RE.test(form.aadhaarNumber)) return setError("Enter a valid 12-digit Aadhaar number.");
    if (!MOBILE_RE.test(form.aadhaarMobile)) return setError("Enter the 10-digit mobile number linked to your Aadhaar.");
    if (!PAN_RE.test(form.panNumber)) return setError("Enter a valid PAN, for example ABCDE1234F.");
    if (!form.addressLine.trim() || !form.city.trim() || !form.state.trim()) {
      return setError("Please enter your full address, city and state.");
    }
    if (!PINCODE_RE.test(form.pincode)) return setError("Enter a valid 6-digit pincode.");
    if (!form.consent) return setError("Please accept the declaration to continue.");

    setLoading(true);
    try {
      const res = await accountApi.initiate(user.token, {
        ...form,
        fullName: form.fullName.trim(),
      });
      setApplication(res);
      setOtp("");
      setCooldown(60);
      setStep("otp");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitOtp = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!/^\d{6}$/.test(otp)) return setError("Enter the 6-digit OTP.");

    setLoading(true);
    try {
      const account = await accountApi.verify(user.token, application.accountId, otp);
      setCreated(account);
      setStep("done");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    setError("");
    setInfo("");
    try {
      await accountApi.resend(user.token, application.accountId);
      setInfo("A new OTP has been sent to your email.");
      setCooldown(60);
    } catch (err) {
      setError(err.message);
    }
  };

  const alerts = (
    <>
      {info && <div className="notice success">{info}</div>}
      {error && (
        <div className="notice error" role="alert">
          <Icon name="alert" size={18} />
          {error}
        </div>
      )}
    </>
  );

  if (step === "done" && created) {
    return (
      <>
        <PageHead title="Account opened" lead="Your FinCore Nexus account is ready to use." />
        <section className="block">
          <div className="container">
            <div className="panel form-card">
              <span className="tag">{created.accountType} account</span>
              <dl className="account-facts">
                <div>
                  <dt>Account number</dt>
                  <dd>{formatAccountNumber(created.accountNumber)}</dd>
                </div>
                <div>
                  <dt>IFSC</dt>
                  <dd>{created.ifsc}</dd>
                </div>
                <div>
                  <dt>Account holder</dt>
                  <dd>{created.fullName}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>{created.status}</dd>
                </div>
              </dl>
              <div style={{ display: "grid", gap: 10 }}>
                <Link to="/accounts" className="btn btn-primary">
                  Go to Accounts
                  <Icon name="arrow" size={18} />
                </Link>
                <Link to="/loans" className="btn btn-outline">
                  Explore loans
                </Link>
              </div>
            </div>
          </div>
        </section>
      </>
    );
  }

  if (step === "otp" && application) {
    return (
      <>
        <PageHead title="Confirm with OTP" lead="One last step to open your account." />
        <section className="block">
          <div className="container">
            <div className="panel form-card">
              <p style={{ marginBottom: 18, color: "var(--muted)" }}>
                We sent a 6-digit OTP to{" "}
                <strong style={{ color: "var(--ink)" }}>{application.maskedEmail}</strong>. It is valid
                for 5 minutes.
              </p>
              {alerts}
              <form onSubmit={submitOtp}>
                <div className="field">
                  <label htmlFor="acc-otp">6-digit OTP</label>
                  <input
                    id="acc-otp"
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
                  {loading ? "Opening account..." : "Verify and open account"}
                </button>
              </form>
              <button
                type="button"
                className="btn btn-outline"
                onClick={resendOtp}
                disabled={cooldown > 0}
                style={{ marginTop: 10 }}
              >
                {cooldown > 0 ? `Resend OTP in ${cooldown}s` : "Resend OTP"}
              </button>
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <PageHead
        title="Open an account"
        lead="Tell us a few details. We will confirm with an OTP on your email."
      />
      <section className="block">
        <div className="container">
          <div className="panel form-card">
            {alerts}
            <form onSubmit={submitDetails}>
              <div className="field">
                <label htmlFor="acc-name">Full name (as on Aadhaar)</label>
                <input id="acc-name" name="fullName" type="text" value={form.fullName}
                  onChange={handleChange} autoComplete="name" required />
              </div>

              <div className="field-row">
                <div className="field">
                  <label htmlFor="acc-aadhaar">Aadhaar number</label>
                  <input id="acc-aadhaar" name="aadhaarNumber" type="text" inputMode="numeric"
                    placeholder="12-digit Aadhaar" value={form.aadhaarNumber}
                    onChange={handleChange} autoComplete="off" required />
                </div>
                <div className="field">
                  <label htmlFor="acc-mobile">Mobile linked to Aadhaar</label>
                  <input id="acc-mobile" name="aadhaarMobile" type="tel" inputMode="numeric"
                    placeholder="10-digit mobile" value={form.aadhaarMobile}
                    onChange={handleChange} autoComplete="tel-national" required />
                </div>
              </div>

              <div className="field-row">
                <div className="field">
                  <label htmlFor="acc-pan">PAN</label>
                  <input id="acc-pan" name="panNumber" type="text" placeholder="ABCDE1234F"
                    value={form.panNumber} onChange={handleChange} autoComplete="off" required />
                </div>
                <div className="field">
                  <label htmlFor="acc-email">Email (OTP will be sent here)</label>
                  <input id="acc-email" type="email" value={user?.email || ""} readOnly disabled />
                </div>
              </div>

              <div className="field">
                <label htmlFor="acc-address">Address</label>
                <input id="acc-address" name="addressLine" type="text" placeholder="House no, street, area"
                  value={form.addressLine} onChange={handleChange} autoComplete="street-address" required />
              </div>

              <div className="field-row">
                <div className="field">
                  <label htmlFor="acc-city">City</label>
                  <input id="acc-city" name="city" type="text" value={form.city}
                    onChange={handleChange} autoComplete="address-level2" required />
                </div>
                <div className="field">
                  <label htmlFor="acc-state">State</label>
                  <input id="acc-state" name="state" type="text" value={form.state}
                    onChange={handleChange} autoComplete="address-level1" required />
                </div>
              </div>

              <div className="field-row">
                <div className="field">
                  <label htmlFor="acc-pin">Pincode</label>
                  <input id="acc-pin" name="pincode" type="text" inputMode="numeric"
                    placeholder="6-digit pincode" value={form.pincode}
                    onChange={handleChange} autoComplete="postal-code" required />
                </div>
                <div className="field">
                  <label htmlFor="acc-type">Account type</label>
                  <select id="acc-type" name="accountType" value={form.accountType} onChange={handleChange}>
                    <option value="SAVINGS">Savings</option>
                    <option value="CURRENT">Current</option>
                  </select>
                </div>
              </div>

              <label className="consent-row" htmlFor="acc-consent">
                <input id="acc-consent" name="consent" type="checkbox"
                  checked={form.consent} onChange={handleChange} />
                <span>
                  I confirm these details are mine and I consent to FinCore Nexus using them for KYC
                  verification.
                </span>
              </label>

              <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 16 }}>
                {loading ? "Sending OTP..." : "Continue"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}