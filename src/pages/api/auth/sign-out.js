import { clearSessionCookieHeader } from "@/lib/auth/set-session-cookie";
import { clearActivityCookieHeader } from "@/lib/auth/activity-cookie";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  res.setHeader("Set-Cookie", [clearSessionCookieHeader(), clearActivityCookieHeader()]);
  return res.status(200).json({ ok: true });
}
