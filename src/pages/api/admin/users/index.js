import { listUsersPublic } from "@/server/persistence/users-store";
import { getSessionFromApiRequest } from "@/lib/auth/session-from-request";
import { respondIfStorageUnavailable } from "@/server/persistence/respond-storage-unavailable";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getSessionFromApiRequest(req);
  if (!session || session.role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    const users = await listUsersPublic();
    return res.status(200).json({ users });
  } catch (e) {
    if (respondIfStorageUnavailable(res, e)) return;
    console.error(e);
    return res.status(500).json({ error: "Failed to list users" });
  }
}
