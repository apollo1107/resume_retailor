import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";

export default function ManualIndex() {
  const router = useRouter();
  const [profileSlug, setProfileSlug] = useState("");
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "dark";
    setTheme(savedTheme);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (profileSlug.trim()) {
      router.push(`/manual/${profileSlug.trim()}`);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const themeColors = {
    dark: {
      bg: "#1a1d24",
      cardBg: "rgba(30, 33, 40, 0.8)",
      cardBorder: "rgba(255, 255, 255, 0.08)",
      text: "#e4e7eb",
      textSecondary: "#b0b5bb",
      buttonBg: "#4a90e2",
      buttonText: "#ffffff",
      linkColor: "#6ab7ff",
    },
    light: {
      bg: "#f5f6f8",
      cardBg: "rgba(255, 255, 255, 0.95)",
      cardBorder: "rgba(0, 0, 0, 0.1)",
      text: "#2c3e50",
      textSecondary: "#5a6c7d",
      buttonBg: "#4a90e2",
      buttonText: "#ffffff",
      linkColor: "#2563eb",
    },
  };

  const colors = themeColors[theme];

  return (
    <>
      <Head>
        <title>Manual Resume - No API Key</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div
        style={{
          minHeight: "100vh",
          background: colors.bg,
          color: colors.text,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif",
          padding: "20px",
          transition: "background 0.3s ease, color 0.3s ease",
        }}
      >
        <div
          style={{
            maxWidth: "800px",
            margin: "0 auto",
            padding: "32px 20px",
          }}
        >
          <div
            style={{
              width: "100%",
              background: colors.cardBg,
              borderRadius: "12px",
              border: `1px solid ${colors.cardBorder}`,
              padding: "40px",
              transition: "all 0.2s ease",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "32px",
              }}
            >
              <h1
                style={{
                  fontSize: "28px",
                  fontWeight: "600",
                  color: colors.text,
                  margin: 0,
                }}
              >
                Manual Resume Generator
              </h1>
              <button
                onClick={toggleTheme}
                style={{
                  padding: "8px 16px",
                  fontSize: "14px",
                  background: "transparent",
                  border: `1px solid ${colors.cardBorder}`,
                  borderRadius: "8px",
                  color: colors.text,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
              </button>
            </div>

            <p
              style={{
                color: colors.textSecondary,
                marginBottom: "24px",
                fontSize: "15px",
                lineHeight: 1.6,
              }}
            >
              Create resumes using ChatGPT manually—no API key required. Enter your profile ID, copy the prompt to ChatGPT, paste the response back, and generate your PDF.
            </p>

            <form
              onSubmit={handleSubmit}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "15px",
                    fontWeight: "400",
                    color: colors.textSecondary,
                    marginBottom: "8px",
                  }}
                >
                  Enter Profile ID
                </label>
                <input
                  type="text"
                  value={profileSlug}
                  onChange={(e) => setProfileSlug(e.target.value)}
                  placeholder="e.g. as1, js1, lm1"
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    fontSize: "16px",
                    fontFamily: "inherit",
                    color: colors.text,
                    background: theme === "dark" ? "#1e293b" : "#fff",
                    border: `1px solid ${theme === "dark" ? "#475569" : "#cbd5e1"}`,
                    borderRadius: "8px",
                    outline: "none",
                    transition: "all 0.2s ease",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={!profileSlug.trim()}
                style={{
                  width: "100%",
                  padding: "14px 24px",
                  fontSize: "16px",
                  fontWeight: "500",
                  color: colors.buttonText,
                  background: profileSlug.trim() ? colors.buttonBg : "#475569",
                  border: "none",
                  borderRadius: "8px",
                  cursor: profileSlug.trim() ? "pointer" : "not-allowed",
                  transition: "all 0.2s ease",
                }}
              >
                Go to Manual Resume
              </button>
            </form>

            <div
              style={{
                marginTop: "24px",
                paddingTop: "24px",
                borderTop: `1px solid ${colors.cardBorder}`,
              }}
            >
              <Link
                href="/"
                style={{
                  color: colors.linkColor || colors.buttonBg,
                  fontSize: "14px",
                  textDecoration: "none",
                }}
              >
                ← Back to API Resume Generator
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
