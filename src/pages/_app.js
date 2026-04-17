import "@/styles/globals.css";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { AuthProvider } from "@/components/AuthProvider";
import { useAuth } from "@/components/AuthProvider";

const PUBLIC_PATHS = new Set(["/sign-in", "/sign-up", "/404"]);

function AuthGate({ children }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (PUBLIC_PATHS.has(router.pathname)) return;
    if (user) return;
    const next = `${router.asPath || "/"}`;
    router.replace(`/sign-in?next=${encodeURIComponent(next)}`);
  }, [loading, user, router.pathname, router.asPath]);

  if (!PUBLIC_PATHS.has(router.pathname) && (loading || !user)) {
    return null;
  }

  return children;
}

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <AuthGate>
        <Component {...pageProps} />
      </AuthGate>
    </AuthProvider>
  );
}
