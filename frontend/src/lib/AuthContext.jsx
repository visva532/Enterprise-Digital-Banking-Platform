import { createContext, useContext, useState, useEffect } from "react";
import { customerApi } from "./api.js";

const AuthContext = createContext(null);

const STORAGE_KEY = "fincore_auth_user";

function loadSession() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const session = JSON.parse(stored);
    if (!session.token || session.expiresAt <= Date.now()) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadSession);

  // Save or clear the session whenever it changes
  useEffect(() => {
    try {
      if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      else localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error("Failed to persist auth session", e);
    }
  }, [user]);

  // Sign the user out automatically when the token expires
  useEffect(() => {
    if (!user?.expiresAt) return;
    const ms = user.expiresAt - Date.now();
    if (ms <= 0) {
      setUser(null);
      return;
    }
    const timer = setTimeout(() => setUser(null), ms);
    return () => clearTimeout(timer);
  }, [user?.expiresAt]);

  // `auth` is the response from /signin or /verify-otp
  const login = (auth) => {
    const session = {
      userId: auth.userId,
      email: auth.email,
      role: auth.role,
      token: auth.accessToken,
      expiresAt: Date.now() + auth.expiresInSeconds * 1000,
      name: auth.email.split("@")[0],
    };
    setUser(session);

    // Best effort: load the real name from Customer Service
    customerApi
      .getMe(session.token)
      .then((profile) => {
        if (profile?.fullName) {
          setUser((prev) => (prev ? { ...prev, name: profile.fullName } : prev));
        }
      })
      .catch(() => {});
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: Boolean(user), login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}