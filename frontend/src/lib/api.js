const AUTH_API = import.meta.env.VITE_AUTH_API || "http://localhost:8086";
const CUSTOMER_API = import.meta.env.VITE_CUSTOMER_API || "http://localhost:8081";

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
  signIn: (email, password) =>
    request(AUTH_API, "/api/auth/signin", { method: "POST", body: { email, password } }),
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