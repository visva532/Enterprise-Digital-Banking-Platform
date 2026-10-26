
const AUTH_API =
  import.meta.env.VITE_AUTH_API || "http://localhost:8086";

const CUSTOMER_API =
  import.meta.env.VITE_CUSTOMER_API || "http://localhost:8081";

const ACCOUNT_API =
  import.meta.env.VITE_ACCOUNT_API || "http://localhost:8082";

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
