import { incrementUserDownload } from "@/server/persistence/downloads-store";
import { getSessionFromApiRequest } from "@/lib/auth/session-from-request";
import { respondIfStorageUnavailable } from "@/server/persistence/respond-storage-unavailable";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getSessionFromApiRequest(req);
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const kind = body.kind;
  if (kind !== "cv" && kind !== "cover") {
    return res.status(400).json({ error: "Invalid kind" });
  }

  try {
    await incrementUserDownload(session.sub, kind);
    return res.status(200).json({ ok: true });
  } catch (e) {
    if (respondIfStorageUnavailable(res, e)) return;
    console.error(e);
    return res.status(500).json({ error: "Failed to record download" });
  }
}
