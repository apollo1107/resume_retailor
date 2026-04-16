import { parseCookies } from "@/lib/auth/cookies";
import { ACTIVITY_COOKIE, isActivityTimestampFresh } from "@/lib/auth/activity-cookie";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session-token";

export async function getSessionFromApiRequest(req) {
  const raw = req.headers?.cookie;
  const cookies = parseCookies(raw || "");
  if (!isActivityTimestampFresh(cookies[ACTIVITY_COOKIE])) return null;
  const token = cookies[SESSION_COOKIE];
  if (!token) return null;
  return verifySessionToken(token);
}

/** Validates JWT only (used by /api/auth/ping to refresh activity cookie). */
export async function getSessionTokenPayloadOnly(req) {
  const raw = req.headers?.cookie;
  const cookies = parseCookies(raw || "");
  const token = cookies[SESSION_COOKIE];
  if (!token) return null;
  return verifySessionToken(token);
}
