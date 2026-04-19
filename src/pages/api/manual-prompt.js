import fs from "fs";
import path from "path";
import { getProfileBySlug } from "@/lib/profiles/registry";
import { loadPromptForProfile } from "@/lib/resume/prompt-loader";
import {
  formatPermanentContextForPrompt,
  profileHasPermanentContent,
} from "@/lib/resume/merge-resume-base";
import { RESUMES_DIR } from "@/config/project-paths";

/**
 * Build the full prompt for manual ChatGPT use (no API key)
 * POST body: { profile: slug, jd: job description }
 */
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  try {
    const { profile: profileSlug, jd } = req.body;

    if (!profileSlug) return res.status(400).json({ error: "Profile slug required" });
    if (!jd) return res.status(400).json({ error: "Job description required" });

    const profileConfig = getProfileBySlug(profileSlug);
    if (!profileConfig) {
      return res.status(404).json({ error: `Profile "${profileSlug}" not found` });
    }

    const resumeName = profileConfig.resume;
    const profilePath = path.join(RESUMES_DIR, `${resumeName}.json`);

    if (!fs.existsSync(profilePath)) {
      return res.status(404).json({ error: `Profile file "${resumeName}.json" not found` });
    }

    const profileData = JSON.parse(fs.readFileSync(profilePath, "utf-8"));

    const calculateYears = (experience) => {
      if (!experience || experience.length === 0) return 0;
      const parseDate = (dateStr) => {
        if (dateStr.toLowerCase() === "present") return new Date();
        return new Date(dateStr);
      };
      const earliest = experience.reduce((min, job) => {
        const date = parseDate(job.start_date);
        return date < min ? date : min;
      }, new Date());
      const years = (new Date() - earliest) / (1000 * 60 * 60 * 24 * 365);
      return Math.round(years);
    };

    const yearsOfExperience = calculateYears(profileData.experience);

    const workHistory = profileData.experience
      .map((job, idx) => {
        const parts = [`${idx + 1}. ${job.company}`];
        if (job.title) parts.push(job.title);
        if (job.location) parts.push(job.location);
        parts.push(`${job.start_date} - ${job.end_date}`);
        return parts.join(" | ");
      })
      .join("\n");

    const education = profileData.education
      .map((edu) => {
        let eduStr = `- ${edu.degree}, ${edu.school} (${edu.start_year}-${edu.end_year})`;
        if (edu.grade) eduStr += ` | GPA: ${edu.grade}`;
        return eduStr;
      })
      .join("\n");

    const hasPermanent = profileHasPermanentContent(profileData);
    const permanentResumeContext =
      formatPermanentContextForPrompt(profileData);
    const experienceBulletGuidance = hasPermanent
      ? "**MANDATORY word count:** every string in `experience[].details` must be **≥25 words** (count space-separated English words; **24 or fewer = invalid**). **When `base_bullets` exist for a role — PREFERRED:** output **`details` with exactly the same array length** as `base_bullets` (same order): **rewrite mode** — each line expands/JD-aligns that base bullet; **bullet count unchanged** on PDF but lines become long. **Alternative:** **append mode** — output **1–3** `details` strings only (hard cap **3** appended); base lines stay as in JSON (may stay short). **Never** remove or omit `base_skills`. Strongest JD fit on **work history #1**."
      : "Per role in `experience[].details`, output **7–10** bullets (**each ≥25 words** — mandatory count). Ground in WORK HISTORY; **tightest JD match** on **work history #1**.";

    const prompt = loadPromptForProfile(profileSlug, {
      name: profileData.name,
      email: profileData.email,
      location: profileData.location,
      yearsOfExperience,
      workHistory,
      education,
      jobDescription: jd,
      experienceCount: profileData.experience.length,
      resumeTitle: profileData.title || "Senior Software Engineer",
      permanentResumeContext,
      experienceBulletGuidance,
    });

    res.setHeader("Content-Type", "application/json");
    res.status(200).json({ prompt });
  } catch (err) {
    console.error("Manual prompt error:", err);
    res.status(500).json({ error: "Failed to build prompt: " + err.message });
  }
}
