import fs from "fs";
import { RESUMES_DIR } from "@/config/server-paths";
import { slugForResumeId } from "@/lib/profile/profile-template-mapping";

export default async function handler(req, res) {
  try {
    const resumesDir = RESUMES_DIR;
    const files = fs.readdirSync(resumesDir);

    const profiles = files
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
    
    res.status(200).json(profiles);
  } catch (error) {
    console.error("Error reading profiles:", error);
    res.status(500).json({ error: "Failed to load profiles" });
  }
}

