import { useState } from "react";
import { useAuth } from "../lib/AuthContext.jsx";
import { useAccounts } from "../lib/useAccounts.js";
import { useAsync } from "../lib/useAsync.js";
import { beneficiaryApi, paymentApi } from "../lib/api.js";
import { PAYMENT_MODES } from "../lib/paymentModes.js";
import { formatAccountNumber, formatINR } from "../lib/format.js";
import Icon from "./Icon.jsx";

const AMOUNT_RE = /^\d{1,8}(\.\d{1,2})?$/;
const EMPTY_FORM = { toAccountNumber: "", amount: "", mode: "UPI", remarks: "" };

export default function SendMoneyPanel() {
  const { user } = useAuth();
  const token = user.token;
  const { primaryAccount, reload: reloadAccount } = useAccounts();
  const payees = useAsync(() => beneficiaryApi.list(token), [token]);

  const [step, setStep] = useState("form"); // form, review, done
  const [form, setForm] = useState(EMPTY_FORM);
  const [receiver, setReceiver] = useState(null); // set once the account number is verified
  const [saveAsPayee, setSaveAsPayee] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const mode = PAYMENT_MODES.find((m) => m.value === form.mode);
  const canSend = primaryAccount && primaryAccount.status === "ACTIVE";
  const alreadySaved =
    receiver && (payees.data || []).some((p) => p.accountNumber === receiver.accountNumber);

  const handleAccountNumber = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 12);
    setForm((f) => ({ ...f, toAccountNumber: digits }));
    if (receiver && receiver.accountNumber !== digits) setReceiver(null);
  };

  const pickPayee = (id) => {
    const payee = (payees.data || []).find((p) => p.id === id);
    if (!payee) return;
    setForm((f) => ({ ...f, toAccountNumber: payee.accountNumber }));
    setReceiver({ accountNumber: payee.accountNumber, holderName: payee.holderName });
    setError("");
  };

  const verify = async () => {
    setError("");
    if (!/^\d{12}$/.test(form.toAccountNumber)) {
      return setError("Enter the receiver's 12-digit account number.");
    }
    setBusy(true);
    try {
      setReceiver(await paymentApi.verifyAccount(token, form.toAccountNumber));
    } catch (err) {
      setReceiver(null);
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const goReview = (e) => {
    e.preventDefault();
    setError("");
    if (!receiver) return setError("Please verify the receiver's account first.");
    if (!AMOUNT_RE.test(form.amount) || Number(form.amount) < 1) {
      return setError("Enter an amount of at least 1.");
    }
    const amount = Number(form.amount);
    if (amount > mode.limit) {
      return setError(`${mode.label} payments are limited to ${formatINR(mode.limit)}.`);
    }
    if (primaryAccount && amount > Number(primaryAccount.balance)) {
      return setError("Your balance is not enough for this payment.");
    }
    // One key per confirmed request: pressing Confirm twice can never pay twice
    setIdempotencyKey(crypto.randomUUID());
    setStep("review");
  };

  const confirm = async () => {
    setError("");
    setBusy(true);
    try {
      const payment = await paymentApi.send(token, {
        toAccountNumber: receiver.accountNumber,
        amount: Number(form.amount),
        mode: form.mode,
        remarks: form.remarks.trim() || undefined,
        idempotencyKey,
      });
      setResult(payment);
      setStep("done");
      reloadAccount();
      if (saveAsPayee && payment.status === "COMPLETED") {
        beneficiaryApi
          .add(token, { accountNumber: receiver.accountNumber })
          .then(payees.reload)
          .catch(() => {});
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setForm(EMPTY_FORM);
    setReceiver(null);
    setSaveAsPayee(false);
    setResult(null);
    setError("");
    setStep("form");
  };

  const errorBox = error && (
    <div className="notice error" role="alert">
      <Icon name="alert" size={18} />
      {error}
    </div>
  );

  if (step === "done" && result) {
    return (
      <div className="panel form-card">
        {result.status === "COMPLETED" && (
          <>
            <div className="notice success">Payment successful.</div>
            <dl className="review-list">
              <div><dt>Amount</dt><dd>{formatINR(result.amount)}</dd></div>
              <div><dt>Paid to</dt><dd>{result.toHolderName} ({result.toAccountMasked})</dd></div>
              <div><dt>Mode</dt><dd>{result.mode}</dd></div>
              <div><dt>Reference</dt><dd>{result.reference}</dd></div>
            </dl>
            <p className="note">An email confirmation has been sent to you and to the receiver.</p>
          </>
        )}
        {result.status === "PENDING" && (
          <>
            <div className="notice success">Your payment is being processed.</div>
            <p className="note">
              Reference {result.reference}. It will complete shortly. Check the History tab in a minute.
            </p>
          </>
        )}
        {result.status === "FAILED" && (
          <>
            <div className="notice error" role="alert">
              <Icon name="alert" size={18} />
              Payment failed: {result.failureReason || "please try again."}
            </div>
            <p className="note">No money was taken from your account.</p>
          </>
        )}
        <button type="button" className="btn btn-primary" onClick={reset} style={{ marginTop: 12 }}>
          Send another payment
        </button>
      </div>
    );
  }

  if (step === "review") {
    return (
      <div className="panel form-card">
        <h3>Review and confirm</h3>
        {errorBox}
        <dl className="review-list">
          <div><dt>From</dt><dd>{formatAccountNumber(primaryAccount.accountNumber)}</dd></div>
          <div><dt>To</dt><dd>{receiver.holderName} ({formatAccountNumber(receiver.accountNumber)})</dd></div>
          <div><dt>Amount</dt><dd>{formatINR(form.amount)}</dd></div>
          <div><dt>Mode</dt><dd>{form.mode}</dd></div>
          {form.remarks.trim() && <div><dt>Remarks</dt><dd>{form.remarks.trim()}</dd></div>}
        </dl>
        {!alreadySaved && (
          <label className="consent-row" htmlFor="save-payee">
            <input
              id="save-payee"
              type="checkbox"
              checked={saveAsPayee}
              onChange={(e) => setSaveAsPayee(e.target.checked)}
            />
            <span>Save {receiver.holderName} as a payee</span>
          </label>
        )}
        <div className="action-row" style={{ marginTop: 16 }}>
          <button type="button" className="btn btn-primary" disabled={busy} onClick={confirm}>
            {busy ? "Sending..." : "Confirm and send"}
          </button>
          <button type="button" className="btn btn-outline" disabled={busy} onClick={() => setStep("form")}>
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="panel form-card">
      <h3>Send money</h3>
      {primaryAccount && (
        <p className="note">
          From account {formatAccountNumber(primaryAccount.accountNumber)} - available balance{" "}
          <strong>{formatINR(primaryAccount.balance)}</strong>
        </p>
      )}
      {primaryAccount && !canSend && (
        <div className="notice error" role="alert">
          <Icon name="alert" size={18} />
          Your account is {primaryAccount.status}. You cannot send money right now.
        </div>
      )}
      {errorBox}

      <form onSubmit={goReview}>
        {(payees.data || []).length > 0 && (
          <div className="field">
            <label htmlFor="pay-payee">Saved payees</label>
            <select id="pay-payee" value="" onChange={(e) => pickPayee(e.target.value)}>
              <option value="">Choose a saved payee</option>
              {payees.data.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nickname ? `${p.nickname} - ` : ""}{p.holderName} ({p.accountNumber})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="field">
          <label htmlFor="pay-to">Receiver's account number</label>
          <div className="inline-form" style={{ marginBottom: 0 }}>
            <input
              id="pay-to"
              inputMode="numeric"
              placeholder="12-digit account number"
              value={form.toAccountNumber}
              onChange={(e) => handleAccountNumber(e.target.value)}
              autoComplete="off"
            />
            <button type="button" className="btn btn-outline" disabled={busy} onClick={verify}>
              Verify
            </button>
          </div>
          {receiver && <span className="hint">Account holder: <strong>{receiver.holderName}</strong></span>}
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="pay-amount">Amount (INR)</label>
            <input
              id="pay-amount"
              inputMode="decimal"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value.replace(/[^\d.]/g, "") })}
            />
            <span className="hint">{mode.label} limit {formatINR(mode.limit)} per payment</span>
          </div>
          <div className="field">
            <label htmlFor="pay-mode">Mode</label>
            <select id="pay-mode" value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })}>
              {PAYMENT_MODES.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <label htmlFor="pay-remarks">Remarks (optional)</label>
          <input
            id="pay-remarks"
            maxLength={100}
            value={form.remarks}
            onChange={(e) => setForm({ ...form, remarks: e.target.value })}
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={busy || !canSend}>
          Continue
        </button>
      </form>
    </div>
  );
}
