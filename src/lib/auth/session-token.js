/**
 * Signed session tokens using HMAC-SHA256 (Web Crypto) — safe in Edge middleware and Node.
 */

const encoder = new TextEncoder();

function getSecretBytes() {
  const s = process.env.AUTH_SECRET || "resume-retailor-dev-auth-secret-change-me";
  return encoder.encode(s);
}

function uint8ToBase64Url(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToUint8(b64url) {
  const pad = "=".repeat((4 - (b64url.length % 4)) % 4);
  const b64 = (b64url + pad).replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

async function importHmacKey() {
  return crypto.subtle.importKey(
    "raw",
    getSecretBytes(),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

function timingSafeEqualBytes(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/**
 * @param {{ sub: string, sid: string, email: string, role: 'user'|'admin', exp: number }} payload
 */
export async function signSessionToken(payload) {
  const payloadJson = JSON.stringify(payload);
  const payloadB64 = uint8ToBase64Url(encoder.encode(payloadJson));
  const key = await importHmacKey();
  const sigBuf = await crypto.subtle.sign("HMAC", key, encoder.encode(payloadB64));
  const sigB64 = uint8ToBase64Url(new Uint8Array(sigBuf));
  return `${payloadB64}.${sigB64}`;
}

export async function verifySessionToken(token) {
  if (typeof token !== "string" || !token.includes(".")) return null;
  const dot = token.lastIndexOf(".");
  const payloadB64 = token.slice(0, dot);
  const sigB64 = token.slice(dot + 1);
  if (!payloadB64 || !sigB64) return null;

  const key = await importHmacKey();
  const sigBuf = await crypto.subtle.sign("HMAC", key, encoder.encode(payloadB64));
  const expected = new Uint8Array(sigBuf);
  let actual;
  try {
    actual = base64UrlToUint8(sigB64);
  } catch {
    return null;
  }
  if (!timingSafeEqualBytes(expected, actual)) return null;

  let payload;
  try {
    const json = new TextDecoder().decode(base64UrlToUint8(payloadB64));
    payload = JSON.parse(json);
  } catch {
    return null;
  }

  if (!payload || typeof payload.exp !== "number" || Date.now() > payload.exp) return null;
  if (
    !payload.sub ||
    !payload.sid ||
    !payload.email ||
    (payload.role !== "user" && payload.role !== "admin")
  ) {
    return null;
  }
  return payload;
}

export const SESSION_COOKIE = "rt_session";
export const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7;
