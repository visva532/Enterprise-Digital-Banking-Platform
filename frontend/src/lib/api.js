
const AUTH_API = import.meta.env.VITE_AUTH_API || "http://localhost:8086";
const CUSTOMER_API = import.meta.env.VITE_CUSTOMER_API || "http://localhost:8081";
const ACCOUNT_API = import.meta.env.VITE_ACCOUNT_API || "http://localhost:8082";
const LOAN_API = import.meta.env.VITE_LOAN_API || "http://localhost:8083";
const PAYMENT_API = import.meta.env.VITE_PAYMENT_API || "http://localhost:8084";
const KYC_API = import.meta.env.VITE_KYC_API || "http://localhost:8085";
let unauthorizedHandler = null;

// AuthContext registers a function here that signs the user out
export function setUnauthorizedHandler(fn) {
  unauthorizedHandler = fn;
}

// Reads the expiry time stored inside the token, so we can tell "expired" from "rejected"
function tokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.exp === "number" && payload.exp * 1000 <= Date.now();
  } catch {
    return false;
  }
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

// ---------- COMMON REQUEST FUNCTION ----------


async function request(baseUrl, path, { method = "GET", body, token } = {}) {
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;

  let response;

  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        ...(isForm ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
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
    // Empty response body
  }

  if (!response.ok) {
    // Handle expired or rejected authentication tokens
    if (response.status === 401 && token) {
      if (tokenExpired(token)) {
        if (unauthorizedHandler) {
          unauthorizedHandler();
        }

        throw new ApiError(
          "Your session has expired. Please sign in again.",
          401
        );
      }

      throw new ApiError(
        "The server did not accept your sign-in token. Please sign out and sign in again. " +
          "If this keeps happening, check that every service uses the same JWT secret.",
        401
      );
    }

    throw new ApiError(
      data?.message ||
        data?.error ||
        `Request failed with status ${response.status}.`,
      response.status
    );
  }

  return data;
}


// ---------- FETCH DOCUMENT / BLOB ----------

async function fetchBlob(baseUrl, path, token) {
  let response;

  try {
    response = await fetch(`${baseUrl}${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    throw new ApiError(
      "Cannot reach the server. Please check that the backend is running.",
      0
    );
  }

  if (!response.ok) {
    throw new ApiError(
      response.status === 404
        ? "Document not found."
        : "Could not load the document.",
      response.status
    );
  }

  return response.blob();
}

// ---------- AUTH API ----------

export const authApi = {
  signUp: (email, password) =>
    request(AUTH_API, "/api/auth/signup", {
      method: "POST",
      body: { email, password },
    }),

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

  signIn: (email, password, loginAs) =>
    request(AUTH_API, "/api/auth/signin", {
      method: "POST",
      body: { email, password, loginAs },
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

// ---------- CUSTOMER API ----------

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

// ---------- ACCOUNT API ----------

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

  transactions: (token, accountId) =>
    request(ACCOUNT_API, `/api/accounts/${accountId}/transactions`, {
      token,
    }),
};

// ---------- LOAN API ----------

export const loanApi = {
  apply: (token, payload) =>
    request(LOAN_API, "/api/loans", {
      method: "POST",
      token,
      body: payload,
    }),

  mine: (token) =>
    request(LOAN_API, "/api/loans/me", { token }),

  list: (token, status) =>
    request(
      LOAN_API,
      `/api/manager/loans${status ? `?status=${status}` : ""}`,
      { token }
    ),

  approve: (token, id, remarks) =>
    request(LOAN_API, `/api/manager/loans/${id}/approve`, {
      method: "PUT",
      token,
      body: { remarks },
    }),

  reject: (token, id, remarks) =>
    request(LOAN_API, `/api/manager/loans/${id}/reject`, {
      method: "PUT",
      token,
      body: { remarks },
    }),
};

// ---------- STAFF / ACCOUNT MANAGEMENT API ----------

const putReason = (path) => (token, id, reason) =>
  request(ACCOUNT_API, path.replace("{id}", id), {
    method: "PUT",
    token,
    body: { reason },
  });

export const staffApi = {
  customers: (token, q) =>
    request(
      CUSTOMER_API,
      `/api/staff/customers?q=${encodeURIComponent(q || "")}`,
      { token }
    ),

  accounts: (token, q, status) =>
    request(
      ACCOUNT_API,
      `/api/staff/accounts?q=${encodeURIComponent(q || "")}${status ? `&status=${status}` : ""}`,
      { token }
    ),

  account: (token, id) =>
    request(ACCOUNT_API, `/api/staff/accounts/${id}`, { token }),

  transactions: (token, id) =>
    request(ACCOUNT_API, `/api/staff/accounts/${id}/transactions`, { token }),

  audit: (token, id) =>
    request(ACCOUNT_API, `/api/manager/accounts/${id}/audit`, { token }),

  freeze: putReason("/api/manager/accounts/{id}/freeze"),

  unfreeze: putReason("/api/manager/accounts/{id}/unfreeze"),
};

// ---------- ADMIN API ----------

export const adminApi = {
  dashboard: (token) =>
    request(ACCOUNT_API, "/api/admin/dashboard", { token }),

  demoDeposit: (token, payload) =>
    request(ACCOUNT_API, "/api/admin/demo/deposit", {
      method: "POST",
      token,
      body: payload,
    }),

  block: putReason("/api/admin/accounts/{id}/block"),

  unblock: putReason("/api/admin/accounts/{id}/unblock"),

  deactivate: putReason("/api/admin/accounts/{id}/deactivate"),

  employees: (token) =>
    request(AUTH_API, "/api/admin/employees", { token }),

  createEmployee: (token, payload) =>
    request(AUTH_API, "/api/admin/employees", {
      method: "POST",
      token,
      body: payload,
    }),

  changeRole: (token, id, role) =>
    request(AUTH_API, `/api/admin/users/${id}/role`, {
      method: "PUT",
      token,
      body: { role },
    }),

  setEnabled: (token, id, enabled) =>
    request(AUTH_API, `/api/admin/users/${id}/enabled`, {
      method: "PUT",
      token,
      body: { enabled },
    }),
};

// ---------- PAYMENT API ----------

export const paymentApi = {
  send: (token, payload) =>
    request(PAYMENT_API, "/api/payments", {
      method: "POST",
      token,
      body: payload,
    }),

  list: (token) =>
    request(PAYMENT_API, "/api/payments", { token }),

  verifyAccount: (token, accountNumber) =>
    request(
      PAYMENT_API,
      `/api/payments/verify-account/${accountNumber}`,
      { token }
    ),
};

// ---------- BENEFICIARY API ----------

export const beneficiaryApi = {
  list: (token) =>
    request(PAYMENT_API, "/api/beneficiaries", { token }),

  add: (token, payload) =>
    request(PAYMENT_API, "/api/beneficiaries", {
      method: "POST",
      token,
      body: payload,
    }),

  remove: (token, id) =>
    request(PAYMENT_API, `/api/beneficiaries/${id}`, {
      method: "DELETE",
      token,
    }),
};

// ---------- CUSTOMER KYC API ----------

export const kycApi = {
  me: (token) =>
    request(KYC_API, "/api/kyc/me", { token }),

  applications: (token) =>
    request(KYC_API, "/api/kyc/applications", { token }),

  submit: (token, data, idProof, selfie) => {
    const form = new FormData();

    form.append(
      "data",
      new Blob([JSON.stringify(data)], {
        type: "application/json",
      })
    );

    form.append("idProof", idProof);
    form.append("selfie", selfie);

    return request(KYC_API, "/api/kyc/applications", {
      method: "POST",
      token,
      body: form,
    });
  },

  verifyOtp: (token, id, otp) =>
    request(KYC_API, `/api/kyc/applications/${id}/verify-otp`, {
      method: "POST",
      token,
      body: { otp },
    }),

  resendOtp: (token, id) =>
    request(KYC_API, `/api/kyc/applications/${id}/resend-otp`, {
      method: "POST",
      token,
    }),
};

// ---------- STAFF / MANAGER KYC API ----------

export const kycStaffApi = {
  list: (token, q, status) =>
    request(
      KYC_API,
      `/api/staff/kyc/applications?q=${encodeURIComponent(q || "")}${status ? `&status=${status}` : ""}`,
      { token }
    ),

  audit: (token, id) =>
    request(
      KYC_API,
      `/api/manager/kyc/applications/${id}/audit`,
      { token }
    ),

  approve: (token, id, remarks) =>
    request(
      KYC_API,
      `/api/manager/kyc/applications/${id}/approve`,
      {
        method: "PUT",
        token,
        body: { remarks },
      }
    ),

  reject: (token, id, remarks) =>
    request(
      KYC_API,
      `/api/manager/kyc/applications/${id}/reject`,
      {
        method: "PUT",
        token,
        body: { remarks },
      }
    ),

  requestReKyc: (token, userId, reason) =>
    request(
      KYC_API,
      `/api/manager/kyc/profiles/${userId}/re-kyc`,
      {
        method: "PUT",
        token,
        body: { reason },
      }
    ),

  document: (token, id, kind) =>
    fetchBlob(
      KYC_API,
      `/api/manager/kyc/applications/${id}/documents/${kind}`,
      token
    ),
};
