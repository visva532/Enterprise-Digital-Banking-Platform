import { useState } from "react";
import { useAuth } from "../lib/AuthContext.jsx";
import { adminApi } from "../lib/api.js";
import { useAsync } from "../lib/useAsync.js";
import { formatDateTime } from "../lib/format.js";
import AsyncView from "./AsyncView.jsx";
import DataTable from "./DataTable.jsx";
import Icon from "./Icon.jsx";
import StatusBadge from "./StatusBadge.jsx";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d).{8,64}$/;
const ROLES = ["TELLER", "MANAGER", "ADMIN"];

export default function EmployeesPanel() {
  const { user } = useAuth();
  const token = user.token;

  const employees = useAsync(() => adminApi.employees(token), [token]);
  const [form, setForm] = useState({ fullName: "", email: "", role: "TELLER", temporaryPassword: "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const act = async (fn, successMessage) => {
    setError("");
    setMessage("");
    setBusy(true);
    try {
      await fn();
      setMessage(successMessage);
      employees.reload();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const create = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim()) return setError("Please enter the employee's full name.");
    if (!EMAIL_RE.test(form.email.trim())) return setError("Please enter a valid email address.");
    if (!PASSWORD_RE.test(form.temporaryPassword)) {
      return setError("Password must be 8-64 characters with at least one letter and one number.");
    }
    const ok = await act(
      () =>
        adminApi.createEmployee(token, {
          ...form,
          fullName: form.fullName.trim(),
          email: form.email.trim().toLowerCase(),
        }),
      "Employee account created. Share the temporary password with them securely."
    );
    if (ok) setForm({ fullName: "", email: "", role: "TELLER", temporaryPassword: "" });
  };

  const columns = [
    { key: "fullName", label: "Name", render: (u) => u.fullName || "-" },
    { key: "email", label: "Email" },
    {
      key: "role",
      label: "Role",
      render: (u) => (
        <select
          value={u.role}
          disabled={busy || u.id === user.userId}
          onChange={(e) => act(() => adminApi.changeRole(token, u.id, e.target.value), "Role updated.")}
          aria-label={`Role for ${u.email}`}
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      ),
    },
    {
      key: "enabled",
      label: "Status",
      render: (u) => <StatusBadge value={u.enabled ? "ACTIVE" : "BLOCKED"} />,
    },
    { key: "createdAt", label: "Created", render: (u) => formatDateTime(u.createdAt) },
    {
      key: "action",
      label: "",
      render: (u) =>
        u.id === user.userId ? (
          "You"
        ) : (
          <button
            type="button"
            className="btn btn-outline"
            disabled={busy}
            onClick={() =>
              act(
                () => adminApi.setEnabled(token, u.id, !u.enabled),
                u.enabled ? "Employee deactivated." : "Employee activated."
              )
            }
          >
            {u.enabled ? "Deactivate" : "Activate"}
          </button>
        ),
    },
  ];

  return (
    <div>
      {error && (
        <div className="notice error" role="alert">
          <Icon name="alert" size={18} />
          {error}
        </div>
      )}
      {message && <div className="notice success">{message}</div>}

      <AsyncView loading={employees.loading && !employees.data} error={employees.error} onRetry={employees.reload}>
        <DataTable columns={columns} rows={employees.data} empty="No employees yet." />
      </AsyncView>

      <div className="panel detail-card">
        <h3>Create an employee account</h3>
        <form onSubmit={create}>
          <div className="field-row">
            <div className="field">
              <label htmlFor="emp-name">Full name</label>
              <input id="emp-name" name="fullName" value={form.fullName} onChange={handleChange} required />
            </div>
            <div className="field">
              <label htmlFor="emp-email">Email</label>
              <input id="emp-email" name="email" type="email" value={form.email} onChange={handleChange} required />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="emp-role">Role</label>
              <select id="emp-role" name="role" value={form.role} onChange={handleChange}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="emp-pass">Temporary password</label>
              <input
                id="emp-pass"
                name="temporaryPassword"
                type="password"
                autoComplete="new-password"
                value={form.temporaryPassword}
                onChange={handleChange}
                required
              />
              <span className="hint">The employee can change it later with "Forgot password".</span>
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            Create employee
          </button>
        </form>
      </div>
    </div>
  );
}