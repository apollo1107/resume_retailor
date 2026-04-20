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
      ? "Follow **all seven rules** in the prompt header. Summary: (**1**) Prefer **same-count** `details` vs `base_bullets` to **expand** each base line; **append** **1–4** **long** lines only for JD **must-haves** still **uncovered**. (**2**) **Never** fewer bullets than profile **`base_bullets`**. (**3**) **Every** bullet **max length** (rule **3**)—never shorten to fit pages. (**4**) **`experience[0]`**/**`[1]`** = flagship. (**5**) **No new** `%` / `$` counts unless in **`base_bullets`**. (**6**) **Dense** layout. (**7**) **2–3** pages—**tune** mainly by **append count** + skills/summary, **not** bullet brevity. **JD checklist:** credible JD requirements must appear in **skills**/**summary**/**experience**; do **not** omit defensible JD items missing from `base_bullets`. **`base_skills` never removed.**"
      : "Follow **all seven rules** in the prompt header. Full `details` per role (**7–10** bullets typical): **maximize** length on **each** bullet; **`experience[0]`**/**`[1]`** especially long and JD-aligned. **JD checklist** in **skills**/**summary**/**experience** where credible. **No invented metrics** unless in **`base_bullets`**. **2–3** pages—adjust **bullet count** per role if needed; **tightest JD match** on **work history #1**.";

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
