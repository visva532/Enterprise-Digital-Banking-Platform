import { useEffect, useState } from "react";
import { useAuth } from "../lib/AuthContext.jsx";
import { kycApi } from "../lib/api.js";
import { GENDERS, OCCUPATIONS, INCOME_RANGES } from "../lib/kycOptions.js";
import Icon from "./Icon.jsx";

const AADHAAR_RE = /^[2-9]\d{11}$/;
const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const MOBILE_RE = /^[6-9]\d{9}$/;
const PINCODE_RE = /^\d{6}$/;
const MAX_FILE = 2 * 1024 * 1024;

function isAdult(dob) {
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 18);
  return new Date(dob) <= cutoff;
}

function fileProblem(file, label, allowPdf) {
  if (!file) return `Please attach your ${label}.`;
  if (file.size > MAX_FILE) return `The ${label} must be 2 MB or smaller.`;
  const allowed = allowPdf ? ["image/jpeg", "image/png", "application/pdf"] : ["image/jpeg", "image/png"];
  if (!allowed.includes(file.type)) {
    return `The ${label} must be ${allowPdf ? "a JPEG, PNG or PDF" : "a JPEG or PNG image"} file.`;
  }
  return "";
}

function Field({ id, label, hint, children }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
}

export default function KycApplyForm({ mode, defaultName, onFinished, onCancel }) {
  const { user } = useAuth();
  const token = user.token;

  const [step, setStep] = useState("details"); // details, otp, done
  const [form, setForm] = useState({
    fullName: defaultName || "",
    dateOfBirth: "",
    gender: "MALE",
    occupation: "SALARIED",
    incomeRange: "UPTO_2_5L",
    aadhaarNumber: "",
    panNumber: "",
    mobile: "",
    addressLine: "",
    city: "",
    state: "",
    pincode: "",
    politicallyExposed: false,
    consent: false,
  });
  const [idProof, setIdProof] = useState(null);
  const [selfie, setSelfie] = useState(null);
  const [application, setApplication] = useState(null);
  const [otp, setOtp] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    let next = type === "checkbox" ? checked : value;
    if (name === "aadhaarNumber") next = value.replace(/\D/g, "").slice(0, 12);
    if (name === "mobile") next = value.replace(/\D/g, "").slice(0, 10);
    if (name === "pincode") next = value.replace(/\D/g, "").slice(0, 6);
    if (name === "panNumber") next = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
    setForm((f) => ({ ...f, [name]: next }));
  };

  const submitDetails = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!form.fullName.trim()) return setError("Please enter your full name as on your ID.");
    if (!form.dateOfBirth) return setError("Please enter your date of birth.");
    if (!isAdult(form.dateOfBirth)) return setError("You must be at least 18 years old to complete KYC.");
    if (!AADHAAR_RE.test(form.aadhaarNumber)) return setError("Enter a valid 12-digit Aadhaar number.");
    if (!PAN_RE.test(form.panNumber)) return setError("Enter a valid PAN, for example ABCDE1234F.");
    if (!MOBILE_RE.test(form.mobile)) return setError("Enter a valid 10-digit mobile number.");
    if (!form.addressLine.trim() || !form.city.trim() || !form.state.trim()) {
      return setError("Please enter your full address, city and state.");
    }
    if (!PINCODE_RE.test(form.pincode)) return setError("Enter a valid 6-digit pincode.");
    const idProblem = fileProblem(idProof, "ID proof", true);
    if (idProblem) return setError(idProblem);
    const selfieProblem = fileProblem(selfie, "selfie", false);
    if (selfieProblem) return setError(selfieProblem);
    if (!form.consent) return setError("Please accept the declaration to continue.");

    setBusy(true);
    try {
      const res = await kycApi.submit(token, { ...form, fullName: form.fullName.trim() }, idProof, selfie);
      setApplication(res);
      setOtp("");
      setCooldown(60);
      setStep("otp");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const submitOtp = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    if (!/^\d{6}$/.test(otp)) return setError("Enter the 6-digit OTP.");

    setBusy(true);
    try {
      setResult(await kycApi.verifyOtp(token, application.applicationId, otp));
      setStep("done");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const resendOtp = async () => {
    setError("");
    setInfo("");
    try {
      await kycApi.resendOtp(token, application.applicationId);
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

  if (step === "done" && result) {
    return (
      <div className="panel form-card">
        {result.status === "APPROVED" ? (
          <div className="notice success">
            Your KYC is verified. A confirmation has been sent to your email.
          </div>
        ) : (
          <div className="notice success">
            Your application was submitted and is under review. We will email you as soon as it is decided.
          </div>
        )}
        <button type="button" className="btn btn-primary" onClick={onFinished} style={{ marginTop: 12 }}>
          Done
        </button>
      </div>
    );
  }

  if (step === "otp" && application) {
    return (
      <div className="panel form-card">
        <h3>Confirm with OTP</h3>
        <p style={{ marginBottom: 14, color: "var(--muted)" }}>{application.message} It is valid for 5 minutes.</p>
        {alerts}
        <form onSubmit={submitOtp}>
          <div className="field">
            <label htmlFor="kyc-otp">6-digit OTP</label>
            <input
              id="kyc-otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              autoFocus
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={busy || otp.length !== 6}>
            {busy ? "Verifying..." : "Verify and submit KYC"}
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
    );
  }

  return (
    <div className="panel form-card">
      <h3>{mode === "RE_KYC" ? "Re-KYC: update your details" : "KYC application"}</h3>
      <p className="note">
        We will email an OTP to <strong>{user.email}</strong> to confirm your submission.
      </p>
      {alerts}
      <form onSubmit={submitDetails}>
        <div className="field-row">
          <Field id="k-name" label="Full name (as on ID)">
            <input id="k-name" name="fullName" value={form.fullName} onChange={handleChange} required />
          </Field>
          <Field id="k-dob" label="Date of birth">
            <input id="k-dob" name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={handleChange} required />
          </Field>
        </div>

        <div className="field-row">
          <Field id="k-gender" label="Gender">
            <select id="k-gender" name="gender" value={form.gender} onChange={handleChange}>
              {GENDERS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field id="k-mobile" label="Mobile number">
            <input id="k-mobile" name="mobile" inputMode="numeric" placeholder="10-digit mobile"
              value={form.mobile} onChange={handleChange} required />
          </Field>
        </div>

        <div className="field-row">
          <Field id="k-occ" label="Occupation">
            <select id="k-occ" name="occupation" value={form.occupation} onChange={handleChange}>
              {OCCUPATIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field id="k-income" label="Annual income">
            <select id="k-income" name="incomeRange" value={form.incomeRange} onChange={handleChange}>
              {INCOME_RANGES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
        </div>

        <div className="field-row">
          <Field id="k-aadhaar" label="Aadhaar number">
            <input id="k-aadhaar" name="aadhaarNumber" inputMode="numeric" placeholder="12-digit Aadhaar"
              value={form.aadhaarNumber} onChange={handleChange} autoComplete="off" required />
          </Field>
          <Field id="k-pan" label="PAN">
            <input id="k-pan" name="panNumber" placeholder="ABCDE1234F"
              value={form.panNumber} onChange={handleChange} autoComplete="off" required />
          </Field>
        </div>

        <Field id="k-address" label="Address">
          <input id="k-address" name="addressLine" placeholder="House no, street, area"
            value={form.addressLine} onChange={handleChange} required />
        </Field>

        <div className="field-row">
          <Field id="k-city" label="City">
            <input id="k-city" name="city" value={form.city} onChange={handleChange} required />
          </Field>
          <Field id="k-state" label="State">
            <input id="k-state" name="state" value={form.state} onChange={handleChange} required />
          </Field>
        </div>

        <Field id="k-pin" label="Pincode">
          <input id="k-pin" name="pincode" inputMode="numeric" placeholder="6-digit pincode"
            value={form.pincode} onChange={handleChange} required />
        </Field>

        <div className="field-row">
          <Field id="k-id" label="ID proof (Aadhaar or PAN card)" hint="JPEG, PNG or PDF, up to 2 MB">
            <input id="k-id" type="file" accept="image/jpeg,image/png,application/pdf"
              onChange={(e) => setIdProof(e.target.files?.[0] || null)} />
          </Field>
          <Field id="k-selfie" label="Selfie" hint="JPEG or PNG, up to 2 MB">
            <input id="k-selfie" type="file" accept="image/jpeg,image/png"
              onChange={(e) => setSelfie(e.target.files?.[0] || null)} />
          </Field>
        </div>

        <label className="consent-row" htmlFor="k-pep">
          <input id="k-pep" name="politicallyExposed" type="checkbox"
            checked={form.politicallyExposed} onChange={handleChange} />
          <span>I am, or am closely related to, a politically exposed person.</span>
        </label>
        <label className="consent-row" htmlFor="k-consent">
          <input id="k-consent" name="consent" type="checkbox" checked={form.consent} onChange={handleChange} />
          <span>I confirm these details and documents are mine and I consent to FinCore Nexus verifying them.</span>
        </label>

        <div className="action-row" style={{ marginTop: 16 }}>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? "Submitting..." : "Submit and get OTP"}
          </button>
          <button type="button" className="btn btn-outline" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}