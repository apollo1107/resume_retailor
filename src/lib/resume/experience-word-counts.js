/**
 * Enforces experience bullet length after merge (first two jobs: 35+ words each; others: 25+).
 */

export function countWords(line) {
  const s = String(line ?? "").trim();
  if (!s) return 0;
  return s.split(/\s+/).filter(Boolean).length;
}

/**
 * @param {Array<{ details?: string[] }>} experience - merged template experience rows
 * @returns {Array<{ jobIndex: number, bulletIndex: number, wordCount: number, minWords: number, reason: string, snippet?: string }>}
 */
export function collectExperienceWordCountFailures(experience) {
  const failures = [];
  if (!Array.isArray(experience)) return failures;

  experience.forEach((job, jobIndex) => {
    const minWords = jobIndex < 2 ? 35 : 25;
    const bullets = Array.isArray(job?.details) ? job.details : [];
    bullets.forEach((line, bulletIndex) => {
      const text = String(line ?? "").trim();
      if (!text) {
        failures.push({
          jobIndex,
          bulletIndex,
          wordCount: 0,
          minWords,
          reason: "empty_bullet",
        });
        return;
      }
      const wordCount = countWords(text);
      if (wordCount < minWords) {
        failures.push({
          jobIndex,
          bulletIndex,
          wordCount,
          minWords,
          reason: "below_minimum",
          snippet: text.length > 140 ? `${text.slice(0, 140)}…` : text,
        });
      }
    });
  });

  return failures;
}

export function formatExperienceWordCountErrorText(failures) {
  if (!failures.length) return "";
  const lines = [
    "Experience bullets do not meet the required word counts.",
    "First two jobs (top of résumé): each bullet needs at least 35 words.",
    "All other jobs: each bullet needs at least 25 words.",
    "",
    "Fix the model output (or pasted JSON) and try again:",
  ];
  failures.forEach((f) => {
    const jobN = f.jobIndex + 1;
    const bulletN = f.bulletIndex + 1;
    if (f.reason === "empty_bullet") {
      lines.push(`• Job ${jobN}, bullet ${bulletN}: empty line (remove it or add text).`);
    } else {
      lines.push(
        `• Job ${jobN}, bullet ${bulletN}: ${f.wordCount} words (need at least ${f.minWords}).`
      );
      if (f.snippet) lines.push(`  ${f.snippet}`);
    }
  });
  return lines.join("\n");
}
