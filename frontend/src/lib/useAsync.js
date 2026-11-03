import { useCallback, useEffect, useRef, useState } from "react";

// Runs an async function and tracks data / loading / error. Ignores out-of-date responses.
export function useAsync(fn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const latest = useRef(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(async () => {
    const id = ++latest.current;
    setLoading(true);
    setError("");
    try {
      const result = await fn();
      if (id === latest.current) setData(result);
    } catch (err) {
      if (id === latest.current) setError(err.message);
    } finally {
      if (id === latest.current) setLoading(false);
    }
  }, deps);

  useEffect(() => {
    run();
  }, [run]);

  return { data, loading, error, reload: run };
}
