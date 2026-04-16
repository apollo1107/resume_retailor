import { findUserById } from "@/server/persistence/users-store";
import { getSessionFromApiRequest } from "@/lib/auth/session-from-request";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getSessionFromApiRequest(req);
  if (!session) {
    return res.status(200).json({ user: null });
  }

  const user = await findUserById(session.sub);
  if (!user) {
    return res.status(200).json({ user: null });
  }

  return res.status(200).json({
    user: { id: user.id, email: user.email, role: user.role },
  });
}
