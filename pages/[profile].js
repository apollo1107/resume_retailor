import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { slugToProfileName } from "../lib/profile-template-mapping";
import { firstNameFromFullName } from "../lib/profile-utils";
import { QuickCopyIcon, DockPinIcon } from "../lib/quick-copy-icons";
import { QUICK_COPY_ANIMATIONS_CSS, quickCopyAnimSlot } from "../lib/quick-copy-animations-css";
import { SPARKLE_PROFILE_CSS } from "../lib/sparkle-ui-css";
import { EmailSnippetsSidebar } from "../components/EmailSnippetsSidebar";

function ProfileLoadingSpinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "40px" }}>
      <style>{`
        @keyframes rtProfileSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <div
        style={{
          width: "40px",
          height: "40px",
          border: "3px solid rgba(74, 144, 226, 0.3)",
          borderTop: "3px solid #4a90e2",
          borderRadius: "50%",
          animation: "rtProfileSpin 1s linear infinite",
        }}
      />
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { profile: profileSlug } = router.query;

  const [jd, setJd] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [generating, setGenerating] = useState(null); // null | "pdf" | "docx"
  const [elapsedTime, setElapsedTime] = useState(0);
  const [lastGenerationTime, setLastGenerationTime] = useState(null);
  const [selectedProfileData, setSelectedProfileData] = useState(null);
  const [profileName, setProfileName] = useState("");
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState(null);
  const [quickCopyDockPinned, setQuickCopyDockPinned] = useState(false);
  const timerIntervalRef = useRef(null);
  const startTimeRef = useRef(null);

  // Lazy load profile data when profile slug changes
  useEffect(() => {
    if (!profileSlug) return;

    setLoading(true);
    const profileNameFromSlug = slugToProfileName(profileSlug);

    if (!profileNameFromSlug) {
      console.error(`Profile not found for slug: ${profileSlug}`);
      setLoading(false);
      router.push('/');
      return;
    }

    setProfileName(profileNameFromSlug);

    // Lazy load profile data with delay to show loading state
    const loadData = async () => {
      try {
        const response = await fetch(`/api/profiles/${encodeURIComponent(profileNameFromSlug)}`);
        if (!response.ok) {
          if (response.status === 404) {
            console.error(`Profile file not found: ${profileNameFromSlug}`);
            router.push('/');
            return;
          }
          throw new Error(`Failed to fetch profile: ${response.statusText}`);
        }
        const data = await response.json();
        setSelectedProfileData(data);
      } catch (err) {
        console.error("Failed to load profile data:", err);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    // Small delay for better UX (allows loading state to show)
    const timer = setTimeout(loadData, 100);
    return () => clearTimeout(timer);
  }, [profileSlug, router]);

  // Copy to clipboard function
  const copyToClipboard = async (text, fieldName) => {
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  // Get last company and role
  const getLastCompany = () => {
    return selectedProfileData?.experience?.[0]?.company || null;
  };

  const getLastRole = () => {
    return selectedProfileData?.experience?.[0]?.title || null;
  };

  const handleGenerate = async (outputFormat) => {
    if (!jd.trim()) {
      alert("Please enter a job description");
      return;
    }

    if (!selectedProfileData || !profileSlug) {
      alert("Profile data not loaded");
      return;
    }

    const fmt = outputFormat === "docx" ? "docx" : "pdf";
    setGenerating(fmt);
    setElapsedTime(0);
    startTimeRef.current = Date.now();

    timerIntervalRef.current = setInterval(() => {
      if (startTimeRef.current) {
        setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }
    }, 1000);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: profileSlug,
          jd: jd,
          companyName: companyName.trim() || null,
          format: fmt,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Download failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      const contentDisposition = response.headers.get("Content-Disposition");
      const ext = fmt === "docx" ? ".docx" : ".pdf";
      let filename = `${profileName?.replace(/\s+/g, "_") || profileSlug}${ext}`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setLastGenerationTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
    } catch (error) {
      console.error("Generation error:", error);
      alert(
        (fmt === "docx" ? "Failed to generate Word file: " : "Failed to generate PDF: ") +
          error.message
      );
    } finally {
      setGenerating(null);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      startTimeRef.current = null;
    }
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  const colors = {
    bg: "#0f172a",
    cardBg: "#1e293b",
    cardBorder: "rgba(148, 163, 184, 0.28)",
    text: "#f1f5f9",
    textSecondary: "#cbd5e1",
    textMuted: "#94a3b8",
    inputBg: "rgba(30, 41, 59, 0.75)",
    inputBorder: "rgba(148, 163, 184, 0.35)",
    inputFocus: "#3b82f6",
    textareaBg: "rgba(30, 41, 59, 0.85)",
    buttonBg: "#3b82f6",
    buttonHover: "#2563eb",
    buttonText: "#ffffff",
    buttonDisabled: "#475569",
    wordButtonBg: "#0d9488",
    wordButtonHover: "#0f766e",
    successBg: "rgba(34, 197, 94, 0.1)",
    successText: "#22c55e",
    infoBg: "rgba(59, 130, 246, 0.1)",
    infoText: "#3b82f6",
    copyBg: "rgba(59, 130, 246, 0.15)",
    copyHover: "rgba(59, 130, 246, 0.25)",
  };

  if (!router.isReady || !profileSlug) {
    return (
      <div
        style={{
          minHeight: "100dvh",
          background: colors.bg,
          color: colors.text,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ProfileLoadingSpinner />
        <p style={{ marginTop: "12px", fontSize: "14px", color: colors.textSecondary }}>Loading…</p>
      </div>
    );
  }

  if (loading || !selectedProfileData) {
    return (
      <div style={{
        minHeight: "100dvh",
        background: colors.bg,
        color: colors.text,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center"
      }}>
        <ProfileLoadingSpinner />
        <p style={{ marginTop: "12px", fontSize: "14px", color: colors.textSecondary }}>Loading profile…</p>
      </div>
    );
  }

  // Quick copy fields
  const quickCopyFields = [
    { key: 'email', label: 'Email', value: selectedProfileData.email },
    { key: 'phone', label: 'Phone', value: selectedProfileData.phone },
    { key: 'location', label: 'Address', value: selectedProfileData.location },
    { key: 'zip', label: 'Zip', value: selectedProfileData.zip },
    { key: 'lastCompany', label: 'Last Company', value: getLastCompany() },
    { key: 'lastRole', label: 'Last Role', value: getLastRole() },
    { key: 'linkedin', label: 'LinkedIn', value: selectedProfileData.linkedin },
    { key: 'github', label: 'GitHub', value: selectedProfileData.github },
  ].filter(field => field.value); // Only show fields with values

  const replyFirstName = firstNameFromFullName(selectedProfileData?.name);

  return (
    <>
      <Head>
        <title>Resume Generator - {profileName}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{QUICK_COPY_ANIMATIONS_CSS}</style>
        <style>{SPARKLE_PROFILE_CSS}</style>
      </Head>

      <div
        className="rt-profile-page"
        style={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          background: colors.bg,
          color: colors.text,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif",
          boxSizing: "border-box",
        }}
      >
        <div className="rt-profile-page-ambient" aria-hidden>
          <div className="rt-profile-page-ambient__glow" />
          <div className="rt-profile-page-sparks">
            {Array.from({ length: 8 }, (_, i) => (
              <span key={i} className="rt-spark" />
            ))}
          </div>
        </div>

        <EmailSnippetsSidebar replyFirstName={replyFirstName} />

        {quickCopyFields.length > 0 && (
          <div className={`rt-top-copy-dock${quickCopyDockPinned ? " rt-top-copy-dock--pinned" : ""}`}>
            <div className="rt-top-copy-dock__hit" aria-hidden />
            <div className="rt-top-copy-dock__panel">
              {quickCopyFields.map(({ key, label, value }, index) => (
                <button
                  key={key}
                  type="button"
                  aria-label={copiedField === key ? `${label} copied` : `Copy ${label}`}
                  className={`rt-quick-copy-btn rt-dock-copy-btn rt-qca-${quickCopyAnimSlot(key)}${copiedField === key ? " rt-quick-copy-btn--copied" : ""}`}
                  onClick={() => copyToClipboard(value, key)}
                  style={{ animationDelay: `${index * 45}ms` }}
                >
                  <span className="rt-quick-copy-icon-wrap">
                    <QuickCopyIcon
                      fieldKey={key}
                      size={48}
                      color={copiedField === key ? colors.successText : "#1e293b"}
                    />
                  </span>
                  <div className="rt-quick-copy-label">{copiedField === key ? "Copied!" : label}</div>
                </button>
              ))}
              <button
                type="button"
                className={`rt-top-copy-dock__pin${quickCopyDockPinned ? " rt-top-copy-dock__pin--active" : ""}`}
                aria-pressed={quickCopyDockPinned}
                aria-label={quickCopyDockPinned ? "Unpin quick-copy bar" : "Pin quick-copy bar open"}
                onClick={() => setQuickCopyDockPinned((p) => !p)}
              >
                <DockPinIcon size={16} color="#0f172a" />
              </button>
            </div>
          </div>
        )}

        <div
          className="rt-profile-page-fill"
          style={{
            flex: "1 1 auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
            padding: "20px 12px",
            boxSizing: "border-box",
            minHeight: "100dvh",
            width: "100%",
          }}
        >
        <div
          className="rt-main-group"
          style={{
            flex: "1 1 auto",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            maxWidth: "min(1600px, 100%)",
            width: "100%",
            margin: "0 auto",
            minWidth: 0,
            boxSizing: "border-box",
            overflow: "auto",
          }}
        >
          <div
            className="rt-profile-card rt-profile-card--form"
            style={{
              flex: "1 1 auto",
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              background: "rgba(15, 23, 42, 0.72)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              borderRadius: "8px",
              border: `1px solid ${colors.cardBorder}`,
              padding: "16px",
              minWidth: 0,
              maxWidth: "100%",
              boxSizing: "border-box",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
            }}
          >
            <div className="rt-pcard-sparkle" aria-hidden>
              <div className="rt-pcard-sparkle__glow" />
              <div className="rt-pcard-sparkle__sparks">
                {Array.from({ length: 6 }, (_, i) => (
                  <span key={i} className="rt-spark" />
                ))}
              </div>
            </div>
            <div
              className="rt-pcard-inner"
              style={{
                flex: "1 1 auto",
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
              }}
            >
            {/* Job Description */}
            <div
              style={{
                flex: "1 1 auto",
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
                marginBottom: "16px",
              }}
            >
              <div style={{ marginBottom: "10px" }}>
                <h1
                  style={{
                    fontSize: "20px",
                    fontWeight: "600",
                    color: colors.text,
                    margin: "0 0 4px 0",
                    lineHeight: 1.25,
                  }}
                >
                  {profileName}
                </h1>
                {selectedProfileData.title ? (
                  <p
                    style={{
                      fontSize: "13px",
                      color: colors.textSecondary,
                      margin: 0,
                      lineHeight: 1.4,
                    }}
                  >
                    {selectedProfileData.title}
                  </p>
                ) : null}
              </div>
              <span
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: "600",
                  color: colors.textSecondary,
                  textTransform: "uppercase",
                  letterSpacing: "0.3px",
                  marginBottom: "6px",
                }}
              >
                Job Description
              </span>
              <textarea
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                placeholder="Paste the job description here..."
                rows="12"
                style={{
                  width: "100%",
                  maxWidth: "100%",
                  flex: "1 1 260px",
                  minHeight: "min(52vh, 520px)",
                  padding: "10px 12px",
                  fontSize: "13px",
                  fontFamily: "inherit",
                  color: colors.text,
                  background: colors.textareaBg,
                  border: `1px solid ${colors.inputBorder}`,
                  borderRadius: "6px",
                  outline: "none",
                  resize: "vertical",
                  lineHeight: "1.5",
                  transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = colors.inputFocus;
                  e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.infoBg}`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = colors.inputBorder;
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Company Name */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{
                display: "block",
                fontSize: "11px",
                fontWeight: "600",
                color: colors.textSecondary,
                marginBottom: "6px",
                textTransform: "uppercase",
                letterSpacing: "0.3px"
              }}>
                Company Name <span style={{ fontWeight: "400", textTransform: "none" }}>(Optional)</span>
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Enter company name for filename..."
                style={{
                  width: "100%",
                  maxWidth: "100%",
                  padding: "8px 12px",
                  fontSize: "13px",
                  fontFamily: "inherit",
                  color: colors.text,
                  background: colors.inputBg,
                  border: `1px solid ${colors.inputBorder}`,
                  borderRadius: "6px",
                  outline: "none",
                  transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                  boxSizing: "border-box"
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = colors.inputFocus;
                  e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.infoBg}`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = colors.inputBorder;
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
                marginBottom: "12px",
                minWidth: 0,
              }}
            >
              <button
                type="button"
                onClick={() => handleGenerate("pdf")}
                disabled={generating !== null || !jd.trim()}
                style={{
                  width: "100%",
                  maxWidth: "100%",
                  minWidth: 0,
                  padding: "10px 12px",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: colors.buttonText,
                  background:
                    generating !== null || !jd.trim()
                      ? colors.buttonDisabled
                      : colors.buttonBg,
                  border: "none",
                  borderRadius: "6px",
                  cursor:
                    generating !== null || !jd.trim() ? "not-allowed" : "pointer",
                  boxSizing: "border-box",
                  transition: "background 0.2s ease, box-shadow 0.2s ease",
                  boxShadow:
                    generating !== null || !jd.trim()
                      ? "none"
                      : "0 2px 8px rgba(59, 130, 246, 0.3)",
                }}
                onMouseEnter={(e) => {
                  if (generating === null && jd.trim()) {
                    e.currentTarget.style.background = colors.buttonHover;
                    e.currentTarget.style.boxShadow =
                      "0 4px 12px rgba(59, 130, 246, 0.4)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (generating === null && jd.trim()) {
                    e.currentTarget.style.background = colors.buttonBg;
                    e.currentTarget.style.boxShadow =
                      "0 2px 8px rgba(59, 130, 246, 0.3)";
                  }
                }}
              >
                {generating === "pdf"
                  ? `Generating… (${elapsedTime}s)`
                  : "Download as PDF file"}
              </button>
              <button
                type="button"
                onClick={() => handleGenerate("docx")}
                disabled={generating !== null || !jd.trim()}
                style={{
                  width: "100%",
                  maxWidth: "100%",
                  minWidth: 0,
                  padding: "10px 12px",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: colors.buttonText,
                  background:
                    generating !== null || !jd.trim()
                      ? colors.buttonDisabled
                      : colors.wordButtonBg,
                  border: "none",
                  borderRadius: "6px",
                  cursor:
                    generating !== null || !jd.trim() ? "not-allowed" : "pointer",
                  boxSizing: "border-box",
                  transition: "background 0.2s ease, box-shadow 0.2s ease",
                  boxShadow:
                    generating !== null || !jd.trim()
                      ? "none"
                      : "0 2px 8px rgba(13, 148, 136, 0.35)",
                }}
                onMouseEnter={(e) => {
                  if (generating === null && jd.trim()) {
                    e.currentTarget.style.background = colors.wordButtonHover;
                    e.currentTarget.style.boxShadow =
                      "0 4px 12px rgba(13, 148, 136, 0.45)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (generating === null && jd.trim()) {
                    e.currentTarget.style.background = colors.wordButtonBg;
                    e.currentTarget.style.boxShadow =
                      "0 2px 8px rgba(13, 148, 136, 0.35)";
                  }
                }}
              >
                {generating === "docx"
                  ? `Generating… (${elapsedTime}s)`
                  : "Download as Word file"}
              </button>
            </div>

            {/* Status Messages */}
            {lastGenerationTime && (
              <div style={{
                padding: "10px 12px",
                background: colors.successBg,
                border: `1px solid ${colors.successText}`,
                borderRadius: "6px",
                color: colors.successText,
                fontSize: "12px",
                textAlign: "center",
                fontWeight: "500"
              }}>
                ✓ Resume generated successfully in {lastGenerationTime}s
              </div>
            )}
            </div>
          </div>
        </div>
        </div>
      </div>
    </>
  );
}
