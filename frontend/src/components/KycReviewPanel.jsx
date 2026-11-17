import { useEffect, useRef, useState } from "react";
import { useAuth } from "../lib/AuthContext.jsx";
import { kycStaffApi } from "../lib/api.js";
import { useAsync } from "../lib/useAsync.js";
import { formatDate, formatDateTime } from "../lib/format.js";
import { GENDERS, INCOME_RANGES, OCCUPATIONS, labelOf } from "../lib/kycOptions.js";
import AsyncView from "./AsyncView.jsx";
import DataTable from "./DataTable.jsx";
import Icon from "./Icon.jsx";
import StatusBadge from "./StatusBadge.jsx";

// canReview = Manager and Admin (decisions, documents, audit trail). Without it the panel is read only (Teller).
export default function KycReviewPanel({ canReview = false }) {
  const { user } = useAuth();
  const token = user.token;

  const [input, setInput] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("UNDER_REVIEW");
  const [selected, setSelected] = useState(null);

  const list = useAsync(() => kycStaffApi.list(token, q, status), [token, q, status]);

  const search = (e) => {
    e.preventDefault();
    setQ(input.trim());
    setSelected(null);
  };

  return (
    <div>
      <form className="inline-form" onSubmit={search}>
        <input
          type="search"
          placeholder="Search by name, email or mobile"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setSelected(null);
          }}
          aria-label="Filter by status"
        >
          <option value="UNDER_REVIEW">Under review</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <button type="submit" className="btn btn-primary">
          Search
        </button>
      </form>

      <AsyncView loading={list.loading} error={list.error} onRetry={list.reload}>
        <DataTable
          columns={[
            { key: "fullName", label: "Name" },
            { key: "email", label: "Email" },
            { key: "type", label: "Type", render: (a) => (a.type === "RE_KYC" ? "Re-KYC" : "New KYC") },
            { key: "riskLevel", label: "Risk", render: (a) => (a.riskLevel ? <StatusBadge value={a.riskLevel} /> : "-") },
            { key: "status", label: "Status", render: (a) => <StatusBadge value={a.status} /> },
            { key: "submittedAt", label: "Submitted", render: (a) => formatDateTime(a.submittedAt) },
          ]}
          rows={list.data}
          selectedId={selected?.id}
          onRowClick={setSelected}
          empty="No KYC applications found."
        />
      </AsyncView>

      {selected && (
        <KycDetail
          key={selected.id}
          application={selected}
          canReview={canReview}
          token={token}
          onChanged={() => {
            setSelected(null);
            list.reload();
          }}
        />
      )}
    </div>
  );
}

function KycDetail({ application: a, canReview, token, onChanged }) {
  const [docs, setDocs] = useState({});
  const [remarks, setRemarks] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const urls = useRef([]);

  const audit = useAsync(
    () => (canReview ? kycStaffApi.audit(token, a.id) : Promise.resolve([])),
    [token, a.id, canReview]
  );

  // Free the browser memory used by the document previews
  useEffect(() => () => urls.current.forEach((u) => URL.revokeObjectURL(u)), []);

  const loadDoc = async (kind) => {
    setError("");
    try {
      const blob = await kycStaffApi.document(token, a.id, kind);
      const url = URL.createObjectURL(blob);
      urls.current.push(url);
      setDocs((d) => ({ ...d, [kind]: { url, type: blob.type } }));
      audit.reload();
    } catch (err) {
      setError(err.message);
    }
  };

  const act = async (fn, success, minLength = 0) => {
    setError("");
    setMessage("");
    if (remarks.trim().length < minLength) {
      return setError(`Please enter at least ${minLength} characters.`);
    }
    setBusy(true);
    try {
      await fn();
      setMessage(success);
      setRemarks("");
      onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const preview = (kind, label) => (
    <div>
      <button type="button" className="btn btn-outline" onClick={() => loadDoc(kind)}>
        View {label}
      </button>
      {docs[kind] &&
        (docs[kind].type.startsWith("image/") ? (
          <div className="doc-preview"><img src={docs[kind].url} alt={label} /></div>
        ) : (
          <p className="note">
            <a href={docs[kind].url} target="_blank" rel="noreferrer">Open the PDF in a new tab</a>
          </p>
        ))}
    </div>
  );

  return (
    <div className="panel detail-card">
      <h3>
        {a.fullName} <StatusBadge value={a.status} />
      </h3>

      <dl className="account-facts">
        <div><dt>Type</dt><dd>{a.type === "RE_KYC" ? "Re-KYC" : "New KYC"}</dd></div>
        <div><dt>Email</dt><dd>{a.email}</dd></div>
        <div><dt>Mobile</dt><dd>{a.mobile}</dd></div>
        <div><dt>Date of birth</dt><dd>{formatDate(a.dateOfBirth)}</dd></div>
        <div><dt>Gender</dt><dd>{labelOf(GENDERS, a.gender)}</dd></div>
        <div><dt>Occupation</dt><dd>{labelOf(OCCUPATIONS, a.occupation)}</dd></div>
        <div><dt>Annual income</dt><dd>{labelOf(INCOME_RANGES, a.incomeRange)}</dd></div>
        <div><dt>Aadhaar</dt><dd>{a.aadhaarMasked}</dd></div>
        <div><dt>PAN</dt><dd>{a.panMasked}</dd></div>
        <div>
          <dt>Address</dt>
          <dd>{[a.addressLine, a.city, a.state, a.pincode].filter(Boolean).join(", ")}</dd>
        </div>
        <div><dt>Politically exposed</dt><dd>{a.politicallyExposed ? "Declared yes" : "No"}</dd></div>
        <div><dt>Risk</dt><dd>{a.riskLevel} ({a.riskScore})</dd></div>
        <div><dt>Face match (simulated)</dt><dd>{a.faceMatchScore != null ? `${a.faceMatchScore}%` : "-"}</dd></div>
      </dl>
      {a.riskNotes && <p className="note"><strong>Automated checks:</strong> {a.riskNotes}</p>}
      {a.decidedBy && (
        <p className="note">
          <strong>Decision:</strong> {a.status} by {a.decidedBy} on {formatDateTime(a.decidedAt)}
          {a.decisionRemarks ? ` - ${a.decisionRemarks}` : ""}
        </p>
      )}

      {canReview && (
        <>
          <h4>Documents</h4>
          <div className="action-row">
            {preview("ID_PROOF", "ID proof")}
            {preview("SELFIE", "selfie")}
          </div>

          {(a.status === "UNDER_REVIEW" || a.status === "APPROVED") && (
            <div className="reason-box">
              <label htmlFor="kyc-remarks">
                {a.status === "UNDER_REVIEW" ? "Remarks (required when rejecting)" : "Reason for Re-KYC (required)"}
              </label>
              <textarea
                id="kyc-remarks"
                rows={2}
                maxLength={300}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
              <div className="action-row">
                {a.status === "UNDER_REVIEW" && (
                  <>
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={busy}
                      onClick={() => act(() => kycStaffApi.approve(token, a.id, remarks.trim()), "Application approved.")}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline"
                      disabled={busy}
                      onClick={() => act(() => kycStaffApi.reject(token, a.id, remarks.trim()), "Application rejected.", 5)}
                    >
                      Reject
                    </button>
                  </>
                )}
                {a.status === "APPROVED" && (
                  <button
                    type="button"
                    className="btn btn-outline"
                    disabled={busy}
                    onClick={() => act(() => kycStaffApi.requestReKyc(token, a.userId, remarks.trim()), "Re-KYC requested.", 5)}
                  >
                    Request Re-KYC
                  </button>
                )}
              </div>
            </div>
          )}

          <h4>Audit trail</h4>
          <AsyncView loading={audit.loading && !audit.data} error={audit.error} onRetry={audit.reload}>
            <DataTable
              columns={[
                { key: "createdAt", label: "When", render: (e) => formatDateTime(e.createdAt) },
                { key: "action", label: "Action" },
                { key: "actor", label: "By", render: (e) => `${e.actor} (${e.actorRole})` },
                { key: "detail", label: "Detail", render: (e) => e.detail || "-" },
              ]}
              rows={audit.data}
              empty="No events yet."
            />
          </AsyncView>
        </>
      )}

      {error && (
        <div className="notice error" role="alert">
          <Icon name="alert" size={18} />
          {error}
        </div>
      )}
      {message && <div className="notice success">{message}</div>}
    </div>
  );
}