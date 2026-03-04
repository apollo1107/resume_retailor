import fs from "fs";
import path from "path";
import React from "react";
import { renderToStream } from "@react-pdf/renderer";
import { getTemplate } from "../../lib/pdf-templates";
import { getTemplateForProfile, getProfileBySlug } from "../../lib/profile-template-mapping";

/**
 * Generate PDF from manually pasted ChatGPT response (no API key)
 * POST body: { profile: slug, chatgptResponse: string, companyName?: string }
 */
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  try {
    const { profile: profileSlug, chatgptResponse: rawResponse, companyName = null } = req.body;

    if (!profileSlug) return res.status(400).send("Profile slug required");
    if (!rawResponse || typeof rawResponse !== "string") {
      return res.status(400).send("ChatGPT response (JSON) required");
    }

    const profileConfig = getProfileBySlug(profileSlug);
    if (!profileConfig) {
      return res.status(404).send(`Profile "${profileSlug}" not found`);
    }

    const resumeName = profileConfig.resume;
    const templateName = getTemplateForProfile(profileSlug) || "Resume";
    const profilePath = path.join(process.cwd(), "resumes", `${resumeName}.json`);

    if (!fs.existsSync(profilePath)) {
      return res.status(404).send(`Profile file "${resumeName}.json" not found`);
    }

    const profileData = JSON.parse(fs.readFileSync(profilePath, "utf-8"));

    // Clean and extract JSON from pasted ChatGPT response
    let content = rawResponse.trim();

    // Remove markdown code blocks
    content = content.replace(/```json\s*/gi, "");
    content = content.replace(/```javascript\s*/gi, "");
    content = content.replace(/```\s*/g, "");

    // Remove common prefixes
    content = content.replace(/^(here is|here's|this is|the json is):?\s*/gi, "");

    // Extract content between first { and last }
    const firstBrace = content.indexOf("{");
    const lastBrace = content.lastIndexOf("}");

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      content = content.substring(firstBrace, lastBrace + 1);
    } else {
      throw new Error("No JSON object found. Please paste the full JSON from ChatGPT.");
    }

    content = content.trim();

    // Parse JSON
    let resumeContent;
    try {
      resumeContent = JSON.parse(content);
    } catch (parseError) {
      try {
        const fixedContent = content.replace(/,(\s*[}\]])/g, "$1");
        resumeContent = JSON.parse(fixedContent);
      } catch (secondError) {
        throw new Error(`Invalid JSON: ${parseError.message}. Check the pasted response.`);
      }
    }

    // Validate required fields
    if (
      !resumeContent.title ||
      !resumeContent.summary ||
      !resumeContent.skills ||
      !resumeContent.experience
    ) {
      throw new Error(
        "Missing required fields (title, summary, skills, or experience). Ensure ChatGPT returned the full JSON."
      );
    }

    const TemplateComponent = getTemplate(templateName);
    if (!TemplateComponent) {
      return res.status(404).send(`Template "${templateName}" not found`);
    }

    const templateData = {
      name: profileData.name,
      title: profileData.title,
      email: profileData.email,
      phone: null,
      location: profileData.location,
      linkedin: null,
      website: null,
      summary: resumeContent.summary,
      skills: resumeContent.skills,
      experience: profileData.experience.map((job, idx) => ({
        title: job.title || resumeContent.experience[idx]?.title || "Engineer",
        company: job.company,
        location: job.location,
        start_date: job.start_date,
        end_date: job.end_date,
        details: resumeContent.experience[idx]?.details || [],
      })),
      education: profileData.education,
    };

    const pdfDocument = React.createElement(TemplateComponent, { data: templateData });
    const pdfStream = await renderToStream(pdfDocument);

    const chunks = [];
    for await (const chunk of pdfStream) {
      chunks.push(chunk);
    }
    const pdfBuffer = Buffer.concat(chunks);

    const nameParts = resumeName ? resumeName.trim().split(/\s+/) : [];
    let baseName;
    if (!nameParts || nameParts.length === 0) baseName = "resume";
    else if (nameParts.length === 1) baseName = nameParts[0];
    else baseName = `${nameParts[0]}_${nameParts[nameParts.length - 1]}`;
    baseName = baseName.replace(/\s+/g, "_").replace(/[^A-Za-z0-9_-]/g, "");

    if (companyName && companyName.trim()) {
      const sanitized = companyName.trim().replace(/\s+/g, "_").replace(/[^A-Za-z0-9_-]/g, "");
      baseName = `${baseName}_${sanitized}`;
    }

    const fileName = `${baseName}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.end(pdfBuffer);
  } catch (err) {
    console.error("Manual PDF generation error:", err);
    res.status(500).send("PDF generation failed: " + err.message);
  }
}
