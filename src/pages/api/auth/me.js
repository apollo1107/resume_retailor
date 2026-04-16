import { findUserById } from "@/server/persistence/users-store";
import { getSessionFromApiRequest } from "@/lib/auth/session-from-request";
import { respondIfStorageUnavailable } from "@/server/persistence/respond-storage-unavailable";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getSessionFromApiRequest(req);
  if (!session) {
    return res.status(200).json({ user: null });
  }

  try {
    const user = await findUserById(session.sub);
    if (!user) {
      return res.status(200).json({ user: null });
    }

    return res.status(200).json({
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (e) {
    if (respondIfStorageUnavailable(res, e)) return;
    console.error(e);
    return res.status(500).json({ error: "Failed to load user" });
  }
}
