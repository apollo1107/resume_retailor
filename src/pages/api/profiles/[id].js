import fs from "fs";
import path from "path";
import { RESUMES_DIR } from "@/config/server-paths";
import { slugForResumeId } from "@/lib/profile/profile-template-mapping";
import {
  loadUiAccessConfig,
  allowedSlugsForUrl,
} from "@/lib/ui-access-config";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: "Profile ID required" });
    }

    const profilePath = path.join(RESUMES_DIR, `${id}.json`);

    if (!fs.existsSync(profilePath)) {
      return res.status(404).json({ error: "Profile not found" });
    }

    const accessUrl =
      typeof req.query.accessUrl === "string" ? req.query.accessUrl : "";
    const uiAccess = loadUiAccessConfig();
    const allowed = allowedSlugsForUrl(accessUrl, uiAccess.urlProfileRules);
    if (allowed) {
      const slug = slugForResumeId(String(id));
      if (!slug || !allowed.has(slug)) {
        return res.status(403).json({ error: "Profile not available for this link." });
      }
    }

    const profileData = JSON.parse(fs.readFileSync(profilePath, "utf-8"));
    res.status(200).json(profileData);
  } catch (error) {
    console.error("Error reading profile:", error);
    res.status(500).json({ error: "Failed to load profile" });
  }
}
