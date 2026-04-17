import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { adminPalette } from "@/components/admin/admin-palette";

const colors = adminPalette;

export default function AdminUserDetailPage() {
  const router = useRouter();
  const userId =
    typeof router.query.userId === "string"
      ? router.query.userId
      : Array.isArray(router.query.userId)
        ? router.query.userId[0]
        : undefined;
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userId || typeof userId !== "string") return;
    let cancelled = false;
    (async () => {
      setError("");
      try {
        const ur = await fetch(`/api/admin/users/${encodeURIComponent(userId)}`);
        const uj = await ur.json().catch(() => ({}));
        if (cancelled) return;
        if (!ur.ok) {
          setError(uj.error || "User not found");
          setUser(null);
          return;
        }
        setUser(uj.user);
      } catch {
        if (!cancelled) setError("Failed to load");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return (
    <>
      <Head>
        <title>{user ? `${user.email} — Admin` : "User — Admin"}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div
        style={{
          minHeight: "100dvh",
          padding: "20px clamp(16px, 3vw, 40px)",
          background: colors.bg,
          color: colors.text,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif",
          boxSizing: "border-box",
        }}
      >
        <div style={{ width: "100%", maxWidth: "960px", margin: "0 auto" }}>
          <button
            type="button"
            onClick={() => router.push("/admin")}
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              border: `1px solid ${colors.border}`,
              background: "rgba(30, 41, 59, 0.6)",
              color: colors.text,
              cursor: "pointer",
              marginBottom: "12px",
            }}
          >
            Back to users
          </button>
          {error ? (
            <p style={{ marginTop: "24px", color: "#f87171" }}>{error}</p>
          ) : user ? (
            <>
              <h1 style={{ marginTop: "8px", marginBottom: "8px", fontSize: "clamp(20px, 2.5vw, 26px)" }}>
                {user.email}
              </h1>
              <p style={{ margin: "0 0 20px 0", color: colors.muted, fontSize: "14px" }}>
                Role: {user.role} · Joined: {user.createdAt ? new Date(user.createdAt).toLocaleString() : "—"}
              </p>
            </>
          ) : (
            <p style={{ marginTop: "24px", color: colors.muted }}>Loading…</p>
          )}
        </div>
      </div>
    </>
  );
}
