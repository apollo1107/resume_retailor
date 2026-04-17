import {
  deleteUserById,
  findUserById,
  setUserAssignedProfilesById,
  setUserPasswordById,
  setUserRoleById,
} from "@/server/persistence/users-store";
import { removeStatsForUser } from "@/server/persistence/downloads-store";
import { isValidPassword } from "@/lib/auth/validation";
import { getSessionFromApiRequest } from "@/lib/auth/session-from-request";

export default async function handler(req, res) {
  const session = await getSessionFromApiRequest(req);
  if (!session || session.role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }

  const rawUserId = req.query.userId;
  const userId =
    typeof rawUserId === "string" ? rawUserId : Array.isArray(rawUserId) ? rawUserId[0] : "";
  if (!userId || typeof userId !== "string") {
    return res.status(400).json({ error: "Invalid user id" });
  }

  if (req.method === "PATCH") {
    try {
      const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
      const password = body.password;
      const role = body.role;
      const assignedProfiles = body.assignedProfiles;

      if (typeof password === "string") {
        if (!isValidPassword(password)) {
          return res.status(400).json({
            error:
              "Password must be at least 8 characters and include a letter, a number, and a special character.",
          });
        }
        await setUserPasswordById(userId, password);
      }

      if (role !== undefined) {
        if (userId === session.sub && role !== "admin") {
          return res.status(400).json({ error: "You cannot demote your own account." });
        }
        await setUserRoleById(userId, role);
      }

      if (assignedProfiles !== undefined) {
        await setUserAssignedProfilesById(userId, assignedProfiles);
      }

      return res.status(200).json({ ok: true });
    } catch (e) {
      const msg = e?.message || "";
      if (e?.message === "User not found") return res.status(404).json({ error: e.message });
      if (
        msg.includes("Maximum") ||
        msg.includes("Invalid role") ||
        msg.includes("Invalid assigned profiles") ||
        msg.includes("only administrator")
      ) {
        return res.status(400).json({ error: msg });
      }
      console.error(e);
      return res.status(500).json({ error: "Failed to update password" });
    }
  }

  if (req.method === "DELETE") {
    try {
      if (userId === session.sub) {
        return res.status(400).json({ error: "You cannot delete your own account from this panel." });
      }
      await deleteUserById(userId);
      await removeStatsForUser(userId);
      return res.status(200).json({ ok: true });
    } catch (e) {
      const msg = e?.message || "Delete failed";
      if (msg.includes("only administrator")) return res.status(400).json({ error: msg });
      if (msg === "User not found") return res.status(404).json({ error: msg });
      console.error(e);
      return res.status(500).json({ error: "Delete failed" });
    }
  }

  if (req.method === "GET") {
    const u = await findUserById(userId);
    if (!u) return res.status(404).json({ error: "User not found" });
    return res.status(200).json({
      user: {
        id: u.id,
        email: u.email,
        role: u.role,
        assignedProfiles: Array.isArray(u.assignedProfiles) ? u.assignedProfiles : [],
        createdAt: u.createdAt,
      },
    });
  }

  res.setHeader("Allow", "GET, PATCH, DELETE");
  return res.status(405).json({ error: "Method not allowed" });
}
