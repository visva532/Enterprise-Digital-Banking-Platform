import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./AuthContext.jsx";
import { accountApi } from "./api.js";

export function useAccounts() {
  const { user, isAuthenticated } = useAuth();
  const token = user?.token;

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(isAuthenticated);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!token) {
      setAccounts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await accountApi.getMine(token);
      setAccounts(data.accounts || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    accounts,
    hasAccount: accounts.length > 0,
    primaryAccount: accounts[0] || null,
    loading,
    error,
    reload: load,
  };
}