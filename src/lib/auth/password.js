import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

export function hashPassword(plain) {
  const salt = randomBytes(16);
  const hash = scryptSync(plain, salt, 64, SCRYPT_PARAMS);
  return {
    salt: salt.toString("base64"),
    hash: hash.toString("base64"),
  };
}

export function verifyPassword(plain, saltB64, hashB64) {
  try {
    const salt = Buffer.from(saltB64, "base64");
    const expected = Buffer.from(hashB64, "base64");
    const actual = scryptSync(plain, salt, expected.length, SCRYPT_PARAMS);
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
