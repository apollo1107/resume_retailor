import { getSessionTokenPayloadOnly } from "@/lib/auth/session-from-request";
import { activityCookieHeader } from "@/lib/auth/activity-cookie";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getSessionTokenPayloadOnly(req);
  if (!session) return res.status(401).json({ error: "Unauthorized" });

  res.setHeader("Set-Cookie", activityCookieHeader());
  return res.status(200).json({ ok: true });
}
