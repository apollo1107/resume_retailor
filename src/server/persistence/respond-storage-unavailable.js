import { AUTH_STORAGE_UNAVAILABLE } from "@/server/persistence/redis-client";

const STORAGE_MESSAGE =
  "Account data cannot be stored on this host without Redis. In Vercel: open your project → Storage → create a Redis (Upstash) store → connect it. Redeploy after Vercel adds UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN (or KV_REST_API_URL / KV_REST_API_TOKEN on older integrations).";

/** @returns {boolean} true if the response was sent */
export function respondIfStorageUnavailable(res, err) {
  if (!err || (err.code !== AUTH_STORAGE_UNAVAILABLE && err.message !== AUTH_STORAGE_UNAVAILABLE)) {
    return false;
  }
  res.status(503).json({ error: STORAGE_MESSAGE, code: "STORAGE_UNAVAILABLE" });
  return true;
}
