import { useState } from "react";
import { useAuth } from "../lib/AuthContext.jsx";
import { useAsync } from "../lib/useAsync.js";
import { beneficiaryApi, paymentApi } from "../lib/api.js";
import AsyncView from "./AsyncView.jsx";
import DataTable from "./DataTable.jsx";
import Icon from "./Icon.jsx";

export default function PayeesPanel() {
  const { user } = useAuth();
  const token = user.token;
  const payees = useAsync(() => beneficiaryApi.list(token), [token]);

  const [number, setNumber] = useState("");
  const [nickname, setNickname] = useState("");
  const [verified, setVerified] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const handleNumber = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 12);
    setNumber(digits);
    if (verified && verified.accountNumber !== digits) setVerified(null);
  };

  const verify = async () => {
    setError("");
    setMessage("");
    if (!/^\d{12}$/.test(number)) return setError("Enter the 12-digit account number.");
    setBusy(true);
    try {
      setVerified(await paymentApi.verifyAccount(token, number));
    } catch (err) {
      setVerified(null);
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    setError("");
    setBusy(true);
    try {
      await beneficiaryApi.add(token, { accountNumber: number, nickname: nickname.trim() || undefined });
      setMessage("Payee saved.");
      setNumber("");
      setNickname("");
      setVerified(null);
      payees.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    setError("");
    setMessage("");
    try {
      await beneficiaryApi.remove(token, id);
      setMessage("Payee removed.");
      payees.reload();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      {error && (
        <div className="notice error" role="alert">
          <Icon name="alert" size={18} />
          {error}
        </div>
      )}
      {message && <div className="notice success">{message}</div>}

      <AsyncView loading={payees.loading && !payees.data} error={payees.error} onRetry={payees.reload}>
        <DataTable
          columns={[
            { key: "holderName", label: "Name" },
            { key: "nickname", label: "Nickname", render: (p) => p.nickname || "-" },
            { key: "accountNumber", label: "Account number" },
            {
              key: "action",
              label: "",
              render: (p) => (
                <button type="button" className="btn btn-outline" onClick={() => remove(p.id)}>
                  Remove
                </button>
              ),
            },
          ]}
          rows={payees.data}
          empty="You have no saved payees yet."
        />
      </AsyncView>

      <div className="panel detail-card">
        <h3>Add a payee</h3>
        <div className="inline-form">
          <input
            inputMode="numeric"
            placeholder="12-digit account number"
            value={number}
            onChange={(e) => handleNumber(e.target.value)}
          />
          <button type="button" className="btn btn-outline" disabled={busy} onClick={verify}>
            Verify
          </button>
        </div>
        {verified && (
          <>
            <p className="note">Account holder: <strong>{verified.holderName}</strong></p>
            <div className="inline-form">
              <input
                placeholder="Nickname (optional)"
                maxLength={60}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
              <button type="button" className="btn btn-primary" disabled={busy} onClick={save}>
                Save payee
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
