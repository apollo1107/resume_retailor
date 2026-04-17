import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { adminPalette } from "@/components/admin/admin-palette";
import { MAX_ADMINS } from "@/config/auth-limits";

const colors = adminPalette;

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [passwordModal, setPasswordModal] = useState({
    open: false,
    userId: "",
    email: "",
    password: "",
    error: "",
    submitting: false,
  });
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    userId: "",
    email: "",
    error: "",
    submitting: false,
  });

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/admin/users");
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Failed to load");
        setUsers(data.users || []);
      } catch (e) {
        setLoadError(e.message || "Failed to load users");
      }
    })();
  }, []);

  const openPasswordModal = (targetId, email) => {
    setPasswordModal({
      open: true,
      userId: targetId,
      email,
      password: "",
      error: "",
      submitting: false,
    });
  };

  const submitPasswordChange = async () => {
    setBusyId(passwordModal.userId);
    setPasswordModal((prev) => ({ ...prev, submitting: true, error: "" }));
    try {
      const r = await fetch(`/api/admin/users/${encodeURIComponent(passwordModal.userId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordModal.password }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setPasswordModal((prev) => ({
          ...prev,
          submitting: false,
          error: data.error || "Could not update password",
        }));
        return;
      }
      setPasswordModal({
        open: false,
        userId: "",
        email: "",
        password: "",
        error: "",
        submitting: false,
      });
    } finally {
      setBusyId(null);
      setPasswordModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  const openDeleteModal = (targetId, email) => {
    setDeleteModal({
      open: true,
      userId: targetId,
      email,
      error: "",
      submitting: false,
    });
  };

  const confirmDeleteUser = async () => {
    setBusyId(deleteModal.userId);
    setDeleteModal((prev) => ({ ...prev, submitting: true, error: "" }));
    try {
      const r = await fetch(`/api/admin/users/${encodeURIComponent(deleteModal.userId)}`, {
        method: "DELETE",
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setDeleteModal((prev) => ({
          ...prev,
          submitting: false,
          error: data.error || "Could not delete user",
        }));
        return;
      }
      setUsers((prev) => prev.filter((u) => u.id !== deleteModal.userId));
      setDeleteModal({
        open: false,
        userId: "",
        email: "",
        error: "",
        submitting: false,
      });
    } finally {
      setBusyId(null);
      setDeleteModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  const updateRole = async (targetId, role) => {
    setBusyId(targetId);
    try {
      const r = await fetch(`/api/admin/users/${encodeURIComponent(targetId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        alert(data.error || "Could not update role");
        return;
      }
      setUsers((prev) => prev.map((u) => (u.id === targetId ? { ...u, role } : u)));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <Head>
        <title>Administrator — Resume Tailor</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div
        style={{
          minHeight: "100dvh",
          padding: "24px",
          background: colors.bg,
          color: colors.text,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif",
        }}
      >
        <div style={{ maxWidth: "960px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
            <h1 style={{ margin: 0, fontSize: "22px" }}>Users</h1>
            <Link href="/" style={{ color: colors.link, fontSize: "14px" }}>
              ← Home
            </Link>
          </div>
          {loadError ? (
            <p style={{ color: colors.danger }}>{loadError}</p>
          ) : (
            <div
              style={{
                border: `1px solid ${colors.border}`,
                borderRadius: "10px",
                overflow: "hidden",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                <thead>
                  <tr style={{ background: "rgba(30, 41, 59, 0.9)", textAlign: "left" }}>
                    <th style={{ padding: "12px 16px", fontWeight: 600 }}>Email</th>
                    <th style={{ padding: "12px 16px", fontWeight: 600 }}>Role</th>
                    <th style={{ padding: "12px 16px", fontWeight: 600 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr
                      key={u.id}
                      style={{ borderTop: `1px solid ${colors.border}`, cursor: "pointer" }}
                      onClick={() => router.push(`/admin/user/${encodeURIComponent(u.id)}`)}
                    >
                      <td style={{ padding: "12px 16px", color: colors.text }}>{u.email}</td>
                      <td style={{ padding: "12px 16px", color: colors.muted }}>{u.role}</td>
                      <td style={{ padding: "8px 16px" }} onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          disabled={busyId === u.id}
                          onClick={() => openPasswordModal(u.id, u.email)}
                          style={{
                            marginRight: "8px",
                            padding: "6px 10px",
                            fontSize: "13px",
                            borderRadius: "6px",
                            border: `1px solid ${colors.border}`,
                            background: "rgba(30, 41, 59, 0.6)",
                            color: colors.text,
                            cursor: busyId === u.id ? "wait" : "pointer",
                          }}
                        >
                          Set password
                        </button>
                        <button
                          type="button"
                          disabled={
                            busyId === u.id ||
                            (u.role !== "admin" &&
                              users.filter((x) => x.role === "admin").length >= MAX_ADMINS)
                          }
                          onClick={() => updateRole(u.id, u.role === "admin" ? "user" : "admin")}
                          style={{
                            marginRight: "8px",
                            padding: "6px 10px",
                            fontSize: "13px",
                            borderRadius: "6px",
                            border: `1px solid ${colors.border}`,
                            background: "rgba(30, 41, 59, 0.6)",
                            color: colors.text,
                            cursor: busyId === u.id ? "wait" : "pointer",
                          }}
                        >
                          {u.role === "admin" ? "Set as user" : "Set as admin"}
                        </button>
                        <button
                          type="button"
                          disabled={busyId === u.id}
                          onClick={() => openDeleteModal(u.id, u.email)}
                          style={{
                            padding: "6px 10px",
                            fontSize: "13px",
                            borderRadius: "6px",
                            border: "none",
                            background: "rgba(127, 29, 29, 0.45)",
                            color: "#fecaca",
                            cursor: busyId === u.id ? "not-allowed" : "pointer",
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p style={{ marginTop: "16px", fontSize: "13px", color: colors.muted }}>
            Click a row for user details.
          </p>
          <p style={{ marginTop: "6px", fontSize: "12px", color: colors.muted }}>
            Maximum administrators allowed: {MAX_ADMINS}
          </p>
        </div>
        {passwordModal.open ? (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(2, 6, 23, 0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px",
              zIndex: 50,
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: "460px",
                borderRadius: "12px",
                border: `1px solid ${colors.border}`,
                background: "#0b1222",
                boxShadow: "0 20px 60px rgba(0, 0, 0, 0.4)",
                padding: "20px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ margin: 0, fontSize: "18px" }}>Change Password</h2>
                <button
                  type="button"
                  onClick={() =>
                    setPasswordModal({
                      open: false,
                      userId: "",
                      email: "",
                      password: "",
                      error: "",
                      submitting: false,
                    })
                  }
                  style={{
                    border: "none",
                    background: "transparent",
                    color: colors.muted,
                    fontSize: "18px",
                    cursor: "pointer",
                  }}
                >
                  ×
                </button>
              </div>
              <p style={{ marginTop: "10px", marginBottom: "14px", fontSize: "13px", color: colors.muted }}>
                User: {passwordModal.email}
              </p>
              <input
                type="password"
                value={passwordModal.password}
                onChange={(e) =>
                  setPasswordModal((prev) => ({ ...prev, password: e.target.value, error: "" }))
                }
                placeholder="New password"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "12px 14px",
                  fontSize: "14px",
                  borderRadius: "8px",
                  border: `1px solid ${colors.border}`,
                  background: "rgba(30, 41, 59, 0.75)",
                  color: colors.text,
                }}
              />
              {passwordModal.error ? (
                <p style={{ marginTop: "10px", marginBottom: 0, color: colors.danger, fontSize: "13px" }}>
                  {passwordModal.error}
                </p>
              ) : null}
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
                <button
                  type="button"
                  onClick={submitPasswordChange}
                  disabled={passwordModal.submitting}
                  style={{
                    padding: "9px 14px",
                    borderRadius: "8px",
                    border: "none",
                    background: "#3b82f6",
                    color: "#fff",
                    fontWeight: 600,
                    cursor: passwordModal.submitting ? "not-allowed" : "pointer",
                  }}
                >
                  {passwordModal.submitting ? "Saving..." : "Save password"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
        {deleteModal.open ? (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(2, 6, 23, 0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px",
              zIndex: 50,
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: "460px",
                borderRadius: "12px",
                border: `1px solid ${colors.border}`,
                background: "#0b1222",
                boxShadow: "0 20px 60px rgba(0, 0, 0, 0.4)",
                padding: "20px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ margin: 0, fontSize: "18px", color: "#fca5a5" }}>Delete User</h2>
                <button
                  type="button"
                  onClick={() =>
                    setDeleteModal({
                      open: false,
                      userId: "",
                      email: "",
                      error: "",
                      submitting: false,
                    })
                  }
                  style={{
                    border: "none",
                    background: "transparent",
                    color: colors.muted,
                    fontSize: "18px",
                    cursor: "pointer",
                  }}
                >
                  ×
                </button>
              </div>
              <p style={{ marginTop: "10px", marginBottom: "14px", fontSize: "13px", color: colors.muted }}>
                This will permanently delete <strong style={{ color: colors.text }}>{deleteModal.email}</strong>.
              </p>
              {deleteModal.error ? (
                <p style={{ marginTop: "10px", marginBottom: 0, color: colors.danger, fontSize: "13px" }}>
                  {deleteModal.error}
                </p>
              ) : null}
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
                <button
                  type="button"
                  onClick={confirmDeleteUser}
                  disabled={deleteModal.submitting}
                  style={{
                    padding: "9px 14px",
                    borderRadius: "8px",
                    border: "none",
                    background: "rgba(185, 28, 28, 0.85)",
                    color: "#fff",
                    fontWeight: 600,
                    cursor: deleteModal.submitting ? "not-allowed" : "pointer",
                  }}
                >
                  {deleteModal.submitting ? "Deleting..." : "Delete user"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
