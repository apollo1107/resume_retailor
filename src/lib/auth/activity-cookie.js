/**
 * HttpOnly activity timestamp cookie — readable in Edge proxy (no filesystem).
 * Used with session JWT so proxy and API agree on "browser session" freshness.
 */

export const ACTIVITY_COOKIE = "rt_activity";

/** If no ping within this window, treat the browser session as ended. */
export const SESSION_ACTIVE_WINDOW_MS = 45 * 1000;

export function activityCookieHeader(nowMs = Date.now()) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${ACTIVITY_COOKIE}=${String(Math.floor(nowMs))}; Path=/; HttpOnly; SameSite=Lax${secure}`;
}

export function clearActivityCookieHeader() {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${ACTIVITY_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

export function isActivityTimestampFresh(raw) {
  if (raw == null || typeof raw !== "string") return false;
  const t = Number(raw);
  if (!Number.isFinite(t)) return false;
  return Date.now() - t <= SESSION_ACTIVE_WINDOW_MS;
}
