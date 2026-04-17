import { useCallback, useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { adminPalette } from "@/components/admin/admin-palette";
import { DownloadActivityChart } from "@/components/admin/DownloadActivityChart";
import chartScrollStyles from "@/components/admin/download-activity-chart.module.css";

const colors = adminPalette;

function utcYmdDaysAgo(daysBack) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysBack);
  return d.toISOString().slice(0, 10);
}

function utcTodayYmd() {
  return new Date().toISOString().slice(0, 10);
}

export default function AdminUserDetailPage() {
  const router = useRouter();
  const userId =
    typeof router.query.userId === "string"
      ? router.query.userId
      : Array.isArray(router.query.userId)
        ? router.query.userId[0]
        : undefined;
  const [user, setUser] = useState(null);
  const [daily, setDaily] = useState([]);
  const [rangeMeta, setRangeMeta] = useState({ from: null, to: null });
  const [error, setError] = useState("");
  const [statsError, setStatsError] = useState("");
  const [fromDate, setFromDate] = useState(() => utcYmdDaysAgo(29));
  const [toDate, setToDate] = useState(() => utcTodayYmd());
  const [statsLoading, setStatsLoading] = useState(false);

  const loadStats = useCallback(async () => {
    if (!userId || typeof userId !== "string") return;
    setStatsLoading(true);
    setStatsError("");
    try {
      const qs = new URLSearchParams({ from: fromDate, to: toDate });
      const sr = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/stats?${qs}`, {
        credentials: "include",
      });
      const sj = await sr.json().catch(() => ({}));
      if (!sr.ok) {
        setDaily([]);
        setRangeMeta({ from: null, to: null });
        setStatsError(sj.error || `Could not load stats (${sr.status}).`);
        return;
      }
      setDaily(Array.isArray(sj.daily) ? sj.daily : []);
      setRangeMeta({ from: sj.from ?? null, to: sj.to ?? null });
    } finally {
      setStatsLoading(false);
    }
  }, [userId, fromDate, toDate]);

  useEffect(() => {
    if (!userId || typeof userId !== "string") return;
    let cancelled = false;
    (async () => {
      setError("");
      try {
        const ur = await fetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
          credentials: "include",
        });
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

  useEffect(() => {
    if (!userId || typeof userId !== "string" || !user) return;
    loadStats();
  }, [userId, user, loadStats]);

  const applyPreset = (daysInclusive) => {
    setToDate(utcTodayYmd());
    setFromDate(utcYmdDaysAgo(daysInclusive - 1));
  };

  const totalCv = daily.reduce((a, d) => a + d.cv, 0);
  const totalCover = daily.reduce((a, d) => a + d.cover, 0);

  const chartScrollHint = daily.length > 14;

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
        <div style={{ width: "100%", maxWidth: "1600px", margin: "0 auto" }}>
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

              <div
                style={{
                  padding: "clamp(16px, 2vw, 24px)",
                  borderRadius: "12px",
                  border: `1px solid ${colors.border}`,
                  background: "rgba(30, 41, 59, 0.35)",
                  marginBottom: "24px",
                  width: "100%",
                  boxSizing: "border-box",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "flex-end",
                    gap: "12px 20px",
                    marginBottom: "16px",
                  }}
                >
                  <h2 style={{ margin: 0, fontSize: "18px", flex: "1 1 200px" }}>Download activity</h2>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
                    <span style={{ fontSize: "12px", color: colors.muted }}>Presets:</span>
                    <button type="button" onClick={() => applyPreset(7)} style={presetBtnStyle}>
                      7 days
                    </button>
                    <button type="button" onClick={() => applyPreset(30)} style={presetBtnStyle}>
                      30 days
                    </button>
                    <button type="button" onClick={() => applyPreset(90)} style={presetBtnStyle}>
                      90 days
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "flex-end",
                    gap: "12px 16px",
                    marginBottom: "16px",
                  }}
                >
                  <div>
                    <label
                      htmlFor="rt-stats-from"
                      style={{ display: "block", fontSize: "12px", color: colors.muted, marginBottom: "4px" }}
                    >
                      From (UTC)
                    </label>
                    <input
                      id="rt-stats-from"
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      style={dateInputStyle}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="rt-stats-to"
                      style={{ display: "block", fontSize: "12px", color: colors.muted, marginBottom: "4px" }}
                    >
                      To (UTC)
                    </label>
                    <input
                      id="rt-stats-to"
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      style={dateInputStyle}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => loadStats()}
                    disabled={statsLoading || !fromDate || !toDate || fromDate > toDate}
                    style={{
                      padding: "10px 18px",
                      borderRadius: "8px",
                      border: "none",
                      background:
                        statsLoading || !fromDate || !toDate || fromDate > toDate ? "#475569" : colors.buttonBg,
                      color: "#fff",
                      fontWeight: 600,
                      cursor:
                        statsLoading || !fromDate || !toDate || fromDate > toDate ? "not-allowed" : "pointer",
                    }}
                  >
                    {statsLoading ? "Loading…" : "Apply range"}
                  </button>
                </div>

                <p style={{ margin: "0 0 12px 0", fontSize: "14px", color: colors.muted }}>
                  Range:{" "}
                  <strong style={{ color: colors.text }}>
                    {rangeMeta.from || "—"} → {rangeMeta.to || "—"}
                  </strong>
                  {" · "}
                  CV downloads: <strong style={{ color: colors.text }}>{totalCv}</strong>
                  {" · "}
                  Cover letter downloads: <strong style={{ color: colors.text }}>{totalCover}</strong>
                </p>

                {fromDate && toDate && fromDate > toDate ? (
                  <p style={{ color: "#f87171", fontSize: "14px" }}>“From” must be on or before “To”.</p>
                ) : null}

                {statsError ? (
                  <p style={{ color: "#f87171", fontSize: "14px", marginTop: "8px" }}>{statsError}</p>
                ) : null}

                <div style={{ width: "100%", marginTop: "8px" }}>
                  {!statsError && daily.length === 0 && !statsLoading ? (
                    <p style={{ color: colors.muted, fontSize: "14px" }}>No days in this range.</p>
                  ) : !statsError ? (
                    <>
                      {chartScrollHint ? (
                        <p style={{ margin: "0 0 8px 0", fontSize: "12px", color: colors.muted }}>
                          Scroll horizontally to see every day.
                        </p>
                      ) : null}
                      <div className={chartScrollStyles.chartScroll}>
                        <DownloadActivityChart daily={daily} />
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            </>
          ) : (
            <p style={{ marginTop: "24px", color: colors.muted }}>Loading…</p>
          )}
        </div>
      </div>
    </>
  );
}

const dateInputStyle = {
  padding: "10px 12px",
  fontSize: "15px",
  borderRadius: "8px",
  border: `1px solid ${colors.border}`,
  background: "rgba(15, 23, 42, 0.8)",
  color: colors.text,
  colorScheme: "dark",
};

const presetBtnStyle = {
  padding: "6px 12px",
  fontSize: "12px",
  borderRadius: "6px",
  border: `1px solid ${colors.border}`,
  background: "rgba(30, 41, 59, 0.75)",
  color: colors.text,
  cursor: "pointer",
};
