import { Link } from "react-router-dom";
import Icon from "./Icon.jsx";
import AsyncView from "./AsyncView.jsx";
import StatusBadge from "./StatusBadge.jsx";
import { useAuth } from "../lib/AuthContext.jsx";
import { useAsync } from "../lib/useAsync.js";
import { kycApi } from "../lib/api.js";
import { formatDate } from "../lib/format.js";

// The summary box. The Kyc page passes onStart so the button opens the form on the same page.
export function KycSummary({ data, onStart }) {
  const latest = data.latestApplication;
  const underReview = latest?.status === "UNDER_REVIEW";
  const needsOtp = latest?.status === "PENDING_OTP";

  const cta = (label) =>
    onStart ? (
      <button type="button" className="btn btn-primary" onClick={onStart}>
        {label}
      </button>
    ) : (
      <Link to="/kyc" className="btn btn-primary">
        {label}
        <Icon name="arrow" size={18} />
      </Link>
    );

  let title = "Complete your KYC";
  let text = "Verify your identity once to unlock loans and other services. It takes about five minutes.";
  let label = "Start KYC";

  if (data.status === "VERIFIED") {
    title = "KYC verified";
    text = `Valid until ${formatDate(data.validUntil)}.`;
    label = "Update KYC details";
    if (data.expiringSoon) {
      text += ` It expires in ${data.daysToExpiry} days, so please renew it now.`;
      label = "Start Re-KYC";
    }
  } else if (data.status === "EXPIRED") {
    title = "KYC expired";
    text = "Your KYC needs to be renewed. Complete Re-KYC to keep using loans and other services.";
    label = "Start Re-KYC";
  } else if (data.status === "REJECTED") {
    title = "KYC not approved";
    text = latest?.remarks
      ? `Reason: ${latest.remarks}. Please correct your details and submit again.`
      : "Please correct your details and submit again.";
    label = "Submit again";
  } else if (data.status === "PENDING" && needsOtp) {
    title = "Finish your KYC submission";
    text = "Your details are saved. Confirm the OTP we emailed you to complete the submission.";
    label = "Continue";
  }

  if (underReview) {
    title = data.status === "VERIFIED" ? "Re-KYC under review" : "KYC under review";
    text = "Our team is reviewing your application. We will email you when it is decided.";
  }

  return (
    <>
      <span className="tag">{title}</span>
      <p style={{ margin: "10px 0 14px", color: "var(--muted)" }}>{text}</p>
      <div className="action-row">
        <StatusBadge value={underReview ? "UNDER_REVIEW" : data.status} />
        {!underReview && data.canApply && cta(needsOtp ? "Continue" : label)}
      </div>
    </>
  );
}

// Used on the Accounts page for customers
export default function KycStatusCard() {
  const { isAuthenticated, user } = useAuth();
  const isCustomer = isAuthenticated && user?.role === "CUSTOMER";
  const token = user?.token;
  const kyc = useAsync(() => (isCustomer ? kycApi.me(token) : Promise.resolve(null)), [token, isCustomer]);

  if (!isCustomer) return null;

  return (
    <div className="panel account-card">
      <AsyncView loading={kyc.loading && !kyc.data} error={kyc.error} onRetry={kyc.reload}>
        {kyc.data && <KycSummary data={kyc.data} />}
      </AsyncView>
    </div>
  );
}