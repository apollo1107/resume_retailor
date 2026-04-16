import { Redis } from "@upstash/redis";

let cached;

/** Upstash (Vercel Marketplace) or legacy KV env names from older integrations. */
export function persistenceRedisEnabled() {
  const url = (process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || "").trim();
  const token = (process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || "").trim();
  return Boolean(url && token);
}

export function getRedis() {
  if (!persistenceRedisEnabled()) return null;
  if (!cached) {
    const url = (process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL).trim();
    const token = (process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN).trim();
    cached = new Redis({ url, token });
  }
  return cached;
}

/** Vercel serverless: local `data/*.json` is not writable; require Redis when deployed. */
export function vercelRequiresRemotePersistence() {
  return Boolean(process.env.VERCEL);
}

export function persistenceUnavailableOnVercel() {
  return vercelRequiresRemotePersistence() && !persistenceRedisEnabled();
}

export const AUTH_STORAGE_UNAVAILABLE = "AUTH_STORAGE_UNAVAILABLE";

export function assertPersistenceAvailable() {
  if (persistenceUnavailableOnVercel()) {
    const err = new Error(AUTH_STORAGE_UNAVAILABLE);
    err.code = AUTH_STORAGE_UNAVAILABLE;
    throw err;
  }
}
