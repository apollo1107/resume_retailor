import { getDailySeries, getDailySeriesRange } from "@/server/persistence/downloads-store";
import { inclusiveUtcRangeDayCount } from "@/server/persistence/download-series";
import { findUserById } from "@/server/persistence/users-store";
import { getSessionFromApiRequest } from "@/lib/auth/session-from-request";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getSessionFromApiRequest(req);
  if (!session || session.role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }

  const rawUserId = req.query.userId;
  const userId =
    typeof rawUserId === "string" ? rawUserId : Array.isArray(rawUserId) ? rawUserId[0] : "";
  if (!userId || typeof userId !== "string") {
    return res.status(400).json({ error: "Invalid user id" });
  }

  if (!(await findUserById(userId))) {
    return res.status(404).json({ error: "User not found" });
  }

  const fromRaw = req.query.from;
  const toRaw = req.query.to;
  const from =
    typeof fromRaw === "string" ? fromRaw.trim() : Array.isArray(fromRaw) ? String(fromRaw[0] ?? "").trim() : "";
  const to =
    typeof toRaw === "string" ? toRaw.trim() : Array.isArray(toRaw) ? String(toRaw[0] ?? "").trim() : "";

  let daily;
  if (from && to) {
    const span = inclusiveUtcRangeDayCount(from, to);
    if (span < 1) {
      return res.status(400).json({ error: "Invalid date range" });
    }
    if (span > 366) {
      return res.status(400).json({ error: "Date range cannot exceed 366 days" });
    }
    daily = await getDailySeriesRange(userId, from, to);
  } else {
    const days = Math.min(90, Math.max(7, Number(req.query.days) || 30));
    daily = await getDailySeries(userId, days);
  }

  return res.status(200).json({ daily, from: daily[0]?.date ?? null, to: daily[daily.length - 1]?.date ?? null });
}
