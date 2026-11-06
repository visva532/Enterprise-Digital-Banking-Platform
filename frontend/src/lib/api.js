const AUTH_API = import.meta.env.VITE_AUTH_API || "http://localhost:8086";
const CUSTOMER_API = import.meta.env.VITE_CUSTOMER_API || "http://localhost:8081";
const ACCOUNT_API = import.meta.env.VITE_ACCOUNT_API || "http://localhost:8082";
const LOAN_API = import.meta.env.VITE_LOAN_API || "http://localhost:8083";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(baseUrl, path, { method = "GET", body, token } = {}) {
  let response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(
      "Cannot reach the server. Please check that the backend is running.",
      0
    );
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    // empty body
  }

  if (!response.ok) {
    if (response.status === 401) {
      throw new ApiError("Your session has expired. Please sign in again.", 401);
    }
    const fieldErrors = data?.errors ? Object.values(data.errors).join(" ") : null;
    throw new ApiError(
      fieldErrors || data?.message || "Something went wrong. Please try again.",
      response.status
    );
  }
  return data;
}

export const authApi = {
  signUp: (email, password) =>
    request(AUTH_API, "/api/auth/signup", { method: "POST", body: { email, password } }),
  verifyOtp: (email, otp) =>
    request(AUTH_API, "/api/auth/verify-otp", { method: "POST", body: { email, otp } }),
  resendOtp: (email) =>
    request(AUTH_API, "/api/auth/resend-otp", { method: "POST", body: { email } }),
  signIn: (email, password, loginAs) =>
    request(AUTH_API, "/api/auth/signin", { method: "POST", body: { email, password, loginAs } }),
  forgotPassword: (email) =>
    request(AUTH_API, "/api/auth/forgot-password", { method: "POST", body: { email } }),
  resetPassword: (email, otp, newPassword) =>
    request(AUTH_API, "/api/auth/reset-password", {
      method: "POST",
      body: { email, otp, newPassword },
    }),
};

export const customerApi = {
  getMe: (token) => request(CUSTOMER_API, "/api/customers/me", { token }),
  updateMe: (token, profile) =>
    request(CUSTOMER_API, "/api/customers/me", { method: "PUT", token, body: profile }),
};

export const accountApi = {
  getMine: (token) => request(ACCOUNT_API, "/api/accounts/me", { token }),
  initiate: (token, payload) =>
    request(ACCOUNT_API, "/api/accounts/open", { method: "POST", token, body: payload }),
  verify: (token, accountId, otp) =>
    request(ACCOUNT_API, "/api/accounts/open/verify", {
      method: "POST",
      token,
      body: { accountId, otp },
    }),
  resend: (token, accountId) =>
    request(ACCOUNT_API, "/api/accounts/open/resend", {
      method: "POST",
      token,
      body: { accountId },
    }),
};

export const loanApi = {
  apply: (token, payload) => request(LOAN_API, "/api/loans", { method: "POST", token, body: payload }),
  mine: (token) => request(LOAN_API, "/api/loans/me", { token }),
  list: (token, status) =>
    request(LOAN_API, `/api/manager/loans${status ? `?status=${status}` : ""}`, { token }),
  approve: (token, id, remarks) =>
    request(LOAN_API, `/api/manager/loans/${id}/approve`, { method: "PUT", token, body: { remarks } }),
  reject: (token, id, remarks) =>
    request(LOAN_API, `/api/manager/loans/${id}/reject`, { method: "PUT", token, body: { remarks } }),
};

const putReason = (path) => (token, id, reason) =>
  request(ACCOUNT_API, path.replace("{id}", id), { method: "PUT", token, body: { reason } });

export const staffApi = {
  customers: (token, q) =>
    request(CUSTOMER_API, `/api/staff/customers?q=${encodeURIComponent(q || "")}`, { token }),
  accounts: (token, q, status) =>
    request(
      ACCOUNT_API,
      `/api/staff/accounts?q=${encodeURIComponent(q || "")}${status ? `&status=${status}` : ""}`,
      { token }
    ),
  account: (token, id) => request(ACCOUNT_API, `/api/staff/accounts/${id}`, { token }),
  transactions: (token, id) => request(ACCOUNT_API, `/api/staff/accounts/${id}/transactions`, { token }),
  audit: (token, id) => request(ACCOUNT_API, `/api/manager/accounts/${id}/audit`, { token }),
  freeze: putReason("/api/manager/accounts/{id}/freeze"),
  unfreeze: putReason("/api/manager/accounts/{id}/unfreeze"),
};

export const adminApi = {
  dashboard: (token) => request(ACCOUNT_API, "/api/admin/dashboard", { token }),
  demoDeposit: (token, payload) =>
    request(ACCOUNT_API, "/api/admin/demo/deposit", { method: "POST", token, body: payload }),
  block: putReason("/api/admin/accounts/{id}/block"),
  unblock: putReason("/api/admin/accounts/{id}/unblock"),
  deactivate: putReason("/api/admin/accounts/{id}/deactivate"),
  employees: (token) => request(AUTH_API, "/api/admin/employees", { token }),
  createEmployee: (token, payload) =>
    request(AUTH_API, "/api/admin/employees", { method: "POST", token, body: payload }),
  changeRole: (token, id, role) =>
    request(AUTH_API, `/api/admin/users/${id}/role`, { method: "PUT", token, body: { role } }),
  setEnabled: (token, id, enabled) =>
    request(AUTH_API, `/api/admin/users/${id}/enabled`, { method: "PUT", token, body: { enabled } }),
};