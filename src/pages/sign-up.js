import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { isValidEmail, isValidPassword } from "@/lib/auth/validation";
import { useAuth } from "@/components/AuthProvider";

const colors = {
  bg: "#0f172a",
  cardBorder: "rgba(148, 163, 184, 0.28)",
  text: "#f1f5f9",
  textSecondary: "#cbd5e1",
  inputBg: "rgba(30, 41, 59, 0.75)",
  inputBorder: "rgba(148, 163, 184, 0.35)",
  buttonBg: "#3b82f6",
  buttonText: "#ffffff",
  error: "#f87171",
};

export default function SignUpPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const validateClient = () => {
    if (!isValidEmail(email)) {
      setError("Enter a valid email address.");
      return false;
    }
    if (!isValidPassword(password)) {
      setError(
        "Password must be at least 8 characters and include a letter, a number, and a special character."
      );
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!validateClient()) return;
    setSubmitting(true);
    try {
      const r = await fetch("/api/auth/sign-up", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(data.error || "Sign up failed.");
        return;
      }
      await refresh();
      await router.replace("/");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Sign up — Resume Tailor</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div
        style={{
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          background: colors.bg,
          color: colors.text,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "400px",
            padding: "32px",
            borderRadius: "12px",
            border: `1px solid ${colors.cardBorder}`,
            background: "rgba(30, 41, 59, 0.5)",
            boxSizing: "border-box",
          }}
        >
          <h1 style={{ margin: "0 0 8px 0", fontSize: "24px", fontWeight: 600 }}>Sign up</h1>
          <p style={{ margin: "0 0 24px 0", color: colors.textSecondary, fontSize: "14px" }}>
            Password must be at least 8 characters with a letter, number, and special character.
          </p>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label
                htmlFor="rt-signup-email"
                style={{ display: "block", fontSize: "14px", color: colors.textSecondary, marginBottom: "6px" }}
              >
                Email
              </label>
              <input
                id="rt-signup-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "12px 14px",
                  fontSize: "16px",
                  color: colors.text,
                  background: colors.inputBg,
                  border: `1px solid ${colors.inputBorder}`,
                  borderRadius: "8px",
                }}
              />
            </div>
            <div>
              <label
                htmlFor="rt-signup-password"
                style={{ display: "block", fontSize: "14px", color: colors.textSecondary, marginBottom: "6px" }}
              >
                Password
              </label>
              <input
                id="rt-signup-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "12px 14px",
                  fontSize: "16px",
                  color: colors.text,
                  background: colors.inputBg,
                  border: `1px solid ${colors.inputBorder}`,
                  borderRadius: "8px",
                }}
              />
            </div>
            {error ? (
              <p style={{ margin: 0, fontSize: "14px", color: colors.error }} role="alert">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={submitting}
              style={{
                marginTop: "8px",
                padding: "12px 16px",
                fontSize: "16px",
                fontWeight: 500,
                color: colors.buttonText,
                background: submitting ? "#475569" : colors.buttonBg,
                border: "none",
                borderRadius: "8px",
                cursor: submitting ? "not-allowed" : "pointer",
              }}
            >
              {submitting ? "Creating account…" : "Create account"}
            </button>
          </form>
          <p style={{ marginTop: "20px", fontSize: "14px", color: colors.textSecondary, textAlign: "center" }}>
            Already have an account?{" "}
            <Link href="/sign-in" style={{ color: colors.buttonBg }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
