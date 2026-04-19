import fs from "fs";
import { RESUMES_DIR } from "@/config/server-paths";
import { slugForResumeId } from "@/lib/profile/profile-template-mapping";
import {
  loadUiAccessConfig,
  allowedSlugsForUrl,
} from "@/lib/ui-access-config";

export default async function handler(req, res) {
  try {
    const resumesDir = RESUMES_DIR;
    const files = fs.readdirSync(resumesDir);

    let profiles = files
      .filter((file) => file.endsWith(".json") && file !== "_template.json")
      .map((file) => {
        const id = file.replace(".json", "");
        const slug = slugForResumeId(id);
        return {
          id,
          name: file.replace(".json", "").replace(/_/g, " "),
          slug,
        };
      })
      .filter((p) => p.slug);

    const accessUrl =
      typeof req.query.accessUrl === "string" ? req.query.accessUrl : "";
    const uiAccess = loadUiAccessConfig();
    const allowed = allowedSlugsForUrl(accessUrl, uiAccess.urlProfileRules);
    if (allowed) {
      profiles = profiles.filter((p) => allowed.has(p.slug));
    }

    res.status(200).json(profiles);
  } catch (error) {
    console.error("Error reading profiles:", error);
    res.status(500).json({ error: "Failed to load profiles" });
  }
}

