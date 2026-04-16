import fs from "fs";
import path from "path";
import { RESUMES_DIR } from "@/config/server-paths";
import { getSessionFromApiRequest } from "@/lib/auth/session-from-request";
import { findUserById, userCanAccessProfile } from "@/server/persistence/users-store";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = await getSessionFromApiRequest(req);
    if (!session) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const user = await findUserById(session.sub);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: "Profile ID required" });
    }
    if (!userCanAccessProfile(user, String(id))) {
      return res.status(403).json({ error: "This resume is not assigned to your account." });
    }

    const profilePath = path.join(RESUMES_DIR, `${id}.json`);

    if (!fs.existsSync(profilePath)) {
      return res.status(404).json({ error: "Profile not found" });
    }

    const profileData = JSON.parse(fs.readFileSync(profilePath, "utf-8"));
    res.status(200).json(profileData);
  } catch (error) {
    console.error("Error reading profile:", error);
    res.status(500).json({ error: "Failed to load profile" });
  }
}
