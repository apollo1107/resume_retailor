const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Minimum rules: 8+ chars, at least one letter, one digit, one special character. */
const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,}$/;

export function isValidEmail(email) {
  if (typeof email !== "string") return false;
  const t = email.trim();
  return t.length > 0 && t.length <= 254 && EMAIL_RE.test(t);
}

export function isValidPassword(password) {
  if (typeof password !== "string") return false;
  return PASSWORD_RE.test(password);
}

export function normalizeEmail(email) {
  return String(email).trim().toLowerCase();
}
