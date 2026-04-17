import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/components/AuthProvider";
import { adminPalette } from "@/components/admin/admin-palette";
import { MAX_ADMINS } from "@/config/auth-limits";

const colors = adminPalette;

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
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
  const [allProfiles, setAllProfiles] = useState([]);
  const [assignModal, setAssignModal] = useState({
    open: false,
    userId: "",
    email: "",
    selected: [],
    error: "",
    submitting: false,
  });

  useEffect(() => {
    if (authLoading || !user || user.role !== "admin") return;
    (async () => {
      try {
        const r = await fetch("/api/admin/users", { credentials: "include" });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Failed to load");
        setUsers(data.users || []);
      } catch (e) {
        setLoadError(e.message || "Failed to load users");
      }
    })();
  }, [authLoading, user]);

  useEffect(() => {
    if (authLoading || !user || user.role !== "admin") return;
    (async () => {
      try {
        const r = await fetch("/api/profiles", { credentials: "include" });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Failed to load resumes");
        setAllProfiles(data || []);
      } catch (e) {
        setLoadError(e.message || "Failed to load resumes");
      }
    })();
  }, [authLoading, user]);

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
        credentials: "include",
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
        credentials: "include",
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
        credentials: "include",
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

  const openAssignModal = (targetUser) => {
    setAssignModal({
      open: true,
      userId: targetUser.id,
      email: targetUser.email,
      selected: Array.isArray(targetUser.assignedProfiles) ? targetUser.assignedProfiles : [],
      error: "",
      submitting: false,
    });
  };

  const submitAssignProfiles = async () => {
    setBusyId(assignModal.userId);
    setAssignModal((prev) => ({ ...prev, submitting: true, error: "" }));
    try {
      const r = await fetch(`/api/admin/users/${encodeURIComponent(assignModal.userId)}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedProfiles: assignModal.selected }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setAssignModal((prev) => ({
          ...prev,
          submitting: false,
          error: data.error || "Could not update assigned resumes",
        }));
        return;
      }
      setUsers((prev) =>
        prev.map((u) =>
          u.id === assignModal.userId ? { ...u, assignedProfiles: assignModal.selected } : u
        )
      );
      setAssignModal({
        open: false,
        userId: "",
        email: "",
        selected: [],
        error: "",
        submitting: false,
      });
    } finally {
      setBusyId(null);
      setAssignModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  if (!authLoading && user && user.role !== "admin") {
    return null;
  }

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
                    <th style={{ padding: "12px 16px", fontWeight: 600 }}>Assigned resumes</th>
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
                      <td style={{ padding: "12px 16px", color: colors.muted }}>
                        {u.role === "admin"
                          ? "All resumes"
                          : `${Array.isArray(u.assignedProfiles) ? u.assignedProfiles.length : 0} selected`}
                      </td>
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
                          disabled={busyId === u.id}
                          onClick={() => openAssignModal(u)}
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
                          Assign resumes
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
                          disabled={busyId === u.id || u.id === user?.id}
                          onClick={() => openDeleteModal(u.id, u.email)}
                          style={{
                            padding: "6px 10px",
                            fontSize: "13px",
                            borderRadius: "6px",
                            border: "none",
                            background: "rgba(127, 29, 29, 0.45)",
                            color: "#fecaca",
                            cursor: busyId === u.id || u.id === user?.id ? "not-allowed" : "pointer",
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
            Click a row to open usage details and download charts.
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
        {assignModal.open ? (
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
                maxWidth: "540px",
                borderRadius: "12px",
                border: `1px solid ${colors.border}`,
                background: "#0b1222",
                boxShadow: "0 20px 60px rgba(0, 0, 0, 0.4)",
                padding: "20px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ margin: 0, fontSize: "18px" }}>Assign Resumes</h2>
                <button
                  type="button"
                  onClick={() =>
                    setAssignModal({
                      open: false,
                      userId: "",
                      email: "",
                      selected: [],
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
                User: {assignModal.email}
              </p>
              <div
                style={{
                  border: `1px solid ${colors.border}`,
                  borderRadius: "8px",
                  maxHeight: "280px",
                  overflow: "auto",
                  padding: "10px",
                }}
              >
                {allProfiles.map((p) => {
                  const checked = assignModal.selected.includes(p.id);
                  return (
                    <label
                      key={p.id}
                      style={{
                        display: "flex",
                        gap: "8px",
                        alignItems: "center",
                        marginBottom: "8px",
                        color: colors.text,
                        fontSize: "13px",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          setAssignModal((prev) => ({
                            ...prev,
                            selected: isChecked
                              ? [...prev.selected, p.id]
                              : prev.selected.filter((id) => id !== p.id),
                          }));
                        }}
                      />
                      {p.name}
                    </label>
                  );
                })}
              </div>
              {assignModal.error ? (
                <p style={{ marginTop: "10px", marginBottom: 0, color: colors.danger, fontSize: "13px" }}>
                  {assignModal.error}
                </p>
              ) : null}
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
                <button
                  type="button"
                  onClick={submitAssignProfiles}
                  disabled={assignModal.submitting}
                  style={{
                    padding: "9px 14px",
                    borderRadius: "8px",
                    border: "none",
                    background: "#3b82f6",
                    color: "#fff",
                    fontWeight: 600,
                    cursor: assignModal.submitting ? "not-allowed" : "pointer",
                  }}
                >
                  {assignModal.submitting ? "Saving..." : "Save assignments"}
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
                This will permanently delete <strong style={{ color: colors.text }}>{deleteModal.email}</strong> and
                all download stats.
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
