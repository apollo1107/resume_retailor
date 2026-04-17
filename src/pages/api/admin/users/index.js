import { listUsersPublic } from "@/server/persistence/users-store";
import { getSessionFromApiRequest } from "@/lib/auth/session-from-request";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getSessionFromApiRequest(req);
  if (!session || session.role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }

  const users = await listUsersPublic();
  return res.status(200).json({ users });
}
