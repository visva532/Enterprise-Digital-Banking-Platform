
const AUTH_API =
  import.meta.env.VITE_AUTH_API || "http://localhost:8086";

const CUSTOMER_API =
  import.meta.env.VITE_CUSTOMER_API || "http://localhost:8081";

const ACCOUNT_API =
  import.meta.env.VITE_ACCOUNT_API || "http://localhost:8082";
const LOAN_API = import.meta.env.VITE_LOAN_API || "http://localhost:8083";

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request(
  baseUrl,
  path,
  { method = "GET", body, token } = {}
) {
  let response;

  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        Accept: "application/json",
        ...(body !== undefined
          ? { "Content-Type": "application/json" }
          : {}),
        ...(token
          ? { Authorization: `Bearer ${token}` }
          : {}),
      },
      ...(body !== undefined
        ? { body: JSON.stringify(body) }
        : {}),
    });
  } catch (error) {
    console.error("API connection failed:", {
      url: `${baseUrl}${path}`,
      error,
    });

    throw new ApiError(
      `Cannot connect to ${baseUrl}. Check that the backend is running, CORS is configured, and the browser can reach the server.`,
      0
    );
  }

  const contentType = response.headers.get("content-type") || "";
  let data = null;

  try {
    if (contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = text ? { message: text } : null;
    }
  } catch (error) {
    console.error("Could not read API response:", error);
  }

  if (!response.ok) {
    const fieldErrors = data?.errors
      ? Object.values(data.errors)
          .flat()
          .join(" ")
      : null;

    const message =
      fieldErrors ||
      data?.message ||
      data?.error ||
      `Request failed with HTTP ${response.status}.`;

    console.error("API request failed:", {
      url: `${baseUrl}${path}`,
      status: response.status,
      response: data,
    });

    throw new ApiError(message, response.status);
  }

  return data;
}

export const authApi = {
    signIn: (email, password, loginAs) =>
    request(AUTH_API, "/api/auth/signin", { method: "POST", body: { email, password, loginAs } }),

  verifyOtp: (email, otp) =>
    request(AUTH_API, "/api/auth/verify-otp", {
      method: "POST",
      body: { email, otp },
    }),

  resendOtp: (email) =>
    request(AUTH_API, "/api/auth/resend-otp", {
      method: "POST",
      body: { email },
    }),

  signIn: (email, password) =>
    request(AUTH_API, "/api/auth/signin", {
      method: "POST",
      body: { email, password },
    }),

  forgotPassword: (email) =>
    request(AUTH_API, "/api/auth/forgot-password", {
      method: "POST",
      body: { email },
    }),

  resetPassword: (email, otp, newPassword) =>
    request(AUTH_API, "/api/auth/reset-password", {
      method: "POST",
      body: { email, otp, newPassword },
    }),
};

export const customerApi = {
  getMe: (token) =>
    request(CUSTOMER_API, "/api/customers/me", { token }),

  updateMe: (token, profile) =>
    request(CUSTOMER_API, "/api/customers/me", {
      method: "PUT",
      token,
      body: profile,
    }),
};

export const accountApi = {
  getMine: (token) =>
    request(ACCOUNT_API, "/api/accounts/me", { token }),

  initiate: (token, payload) =>
    request(ACCOUNT_API, "/api/accounts/open", {
      method: "POST",
      token,
      body: payload,
    }),

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