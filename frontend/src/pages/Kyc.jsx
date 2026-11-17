import { useState } from "react";
import PageHead from "../components/PageHead.jsx";
import AsyncView from "../components/AsyncView.jsx";
import DataTable from "../components/DataTable.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import KycApplyForm from "../components/KycApplyForm.jsx";
import { KycSummary } from "../components/KycStatusCard.jsx";
import { useAuth } from "../lib/AuthContext.jsx";
import { useAsync } from "../lib/useAsync.js";
import { kycApi } from "../lib/api.js";
import { formatDateTime } from "../lib/format.js";

export default function Kyc() {
  const { user } = useAuth();
  const token = user.token;

  const status = useAsync(() => kycApi.me(token), [token]);
  const history = useAsync(() => kycApi.applications(token), [token]);
  const [applying, setApplying] = useState(false);

  const finish = () => {
    setApplying(false);
    status.reload();
    history.reload();
  };

  return (
    <>
      <PageHead title="KYC verification" lead="Verify your identity to unlock loans and other services." />
      <section className="block">
        <div className="container">
          {applying && status.data ? (
            <KycApplyForm
              mode={status.data.applyMode}
              defaultName={user.name}
              onFinished={finish}
              onCancel={() => setApplying(false)}
            />
          ) : (
            <>
              <div className="panel account-card">
                <AsyncView loading={status.loading && !status.data} error={status.error} onRetry={status.reload}>
                  {status.data && <KycSummary data={status.data} onStart={() => setApplying(true)} />}
                </AsyncView>
              </div>

              <h3>My applications</h3>
              <AsyncView loading={history.loading && !history.data} error={history.error} onRetry={history.reload}>
                <DataTable
                  columns={[
                    { key: "createdAt", label: "Started", render: (a) => formatDateTime(a.createdAt) },
                    { key: "type", label: "Type", render: (a) => (a.type === "RE_KYC" ? "Re-KYC" : "New KYC") },
                    { key: "status", label: "Status", render: (a) => <StatusBadge value={a.status} /> },
                    { key: "decidedAt", label: "Decided", render: (a) => formatDateTime(a.decidedAt) },
                    { key: "remarks", label: "Remarks", render: (a) => a.remarks || "-" },
                  ]}
                  rows={history.data}
                  empty="You have not submitted a KYC application yet."
                />
              </AsyncView>
            </>
          )}
        </div>
      </section>
    </>
  );
}