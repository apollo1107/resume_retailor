import { verifyUserLogin } from "@/server/persistence/users-store";
import { randomUUID } from "crypto";
import { isValidEmail, isValidPassword, normalizeEmail } from "@/lib/auth/validation";
import { signSessionToken, SESSION_MAX_AGE_SEC } from "@/lib/auth/session-token";
import { sessionCookieHeader } from "@/lib/auth/set-session-cookie";
import { activityCookieHeader } from "@/lib/auth/activity-cookie";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const email = body.email;
    const password = body.password;

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Enter a valid email address." });
    }
    if (!isValidPassword(password)) {
      return res.status(400).json({
        error:
          "Password must be at least 8 characters and include a letter, a number, and a special character.",
      });
    }

    const user = await verifyUserLogin(email, password);
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const sid = randomUUID();
    const exp = Date.now() + SESSION_MAX_AGE_SEC * 1000;
    const token = await signSessionToken({
      sub: user.id,
      sid,
      email: normalizeEmail(user.email),
      role: user.role === "admin" ? "admin" : "user",
      exp,
    });
    res.setHeader("Set-Cookie", [sessionCookieHeader(token), activityCookieHeader()]);
    return res.status(200).json({
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Sign in failed" });
  }
}
