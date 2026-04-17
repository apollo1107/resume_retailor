import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext({
  user: null,
  loading: true,
  refresh: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch("/api/auth/me", { credentials: "include" });
      const data = await r.json();
      setUser(data.user || null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!user) return undefined;

    const ping = () => {
      fetch("/api/auth/ping", { method: "POST", credentials: "include" }).catch(() => {});
    };

    ping();
    const interval = window.setInterval(ping, 10000);
    const onFocus = () => ping();
    const onVisibility = () => {
      if (document.visibilityState === "visible") ping();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [user]);

  const signOut = useCallback(async () => {
    await fetch("/api/auth/sign-out", { method: "POST", credentials: "include" });
    setUser(null);
    window.location.href = "/sign-in";
  }, []);

  const value = useMemo(
    () => ({ user, loading, refresh, signOut }),
    [user, loading, refresh, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
