/**
 * Post-merge experience checks (approximate “two lines” + a few long bullets on top jobs).
 */

/** ~2 wrapped lines at typical résumé width (10pt body); avoids blocking 26-word bullets. */
export const MIN_WORDS_TWO_LINES = 20;

/** “Long” bullets for the first two jobs (depth / JD fit). */
export const MIN_WORDS_FEATURED = 35;

function stripMarkupForLength(s) {
  return String(s ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

export function countWords(line) {
  const s = stripMarkupForLength(line);
  if (!s) return 0;
  return s.split(/\s+/).filter(Boolean).length;
}

/** How many ≥35-word bullets we require in each of the first two jobs (flexible). */
export function requiredFeaturedBulletCount(bulletCount) {
  const n = Math.max(0, Math.floor(Number(bulletCount)) || 0);
  if (n <= 0) return 0;
  if (n <= 2) return 1;
  return 2;
}

/**
 * @param {Array<{ details?: string[] }>} experience - merged template experience rows
 * @returns {Array<Record<string, unknown>>}
 */
export function collectExperienceWordCountFailures(experience) {
  const failures = [];
  if (!Array.isArray(experience)) return failures;

  experience.forEach((job, jobIndex) => {
    const bullets = Array.isArray(job?.details) ? job.details : [];

    if (jobIndex < 2) {
      const nonEmpty = bullets
        .map((line) => String(line ?? "").trim())
        .filter(Boolean);
      const longCount = nonEmpty.filter(
        (text) => countWords(text) >= MIN_WORDS_FEATURED
      ).length;
      const need = requiredFeaturedBulletCount(nonEmpty.length);
      if (need > 0 && longCount < need) {
        failures.push({
          reason: "too_few_featured_bullets",
          jobIndex,
          found: longCount,
          need,
          bulletCount: nonEmpty.length,
        });
      }
    }

    bullets.forEach((line, bulletIndex) => {
      const text = String(line ?? "").trim();
      if (!text) {
        failures.push({
          jobIndex,
          bulletIndex,
          wordCount: 0,
          minWords: MIN_WORDS_TWO_LINES,
          reason: "empty_bullet",
        });
        return;
      }
      const wordCount = countWords(text);
      if (wordCount < MIN_WORDS_TWO_LINES) {
        failures.push({
          jobIndex,
          bulletIndex,
          wordCount,
          minWords: MIN_WORDS_TWO_LINES,
          reason: "below_two_lines",
          snippet:
            stripMarkupForLength(text).length > 140
              ? `${stripMarkupForLength(text).slice(0, 140)}…`
              : stripMarkupForLength(text),
        });
      }
    });
  });

  return failures;
}

export function formatExperienceWordCountErrorText(failures) {
  if (!failures.length) return "";
  const lines = [
    "Experience bullets do not meet layout / length rules.",
    `Every bullet must be long enough to wrap to about two lines (at least ${MIN_WORDS_TWO_LINES} words).`,
    `For the first two jobs, include enough “depth” bullets (${MIN_WORDS_FEATURED}+ words): at least 1 if that job has only 1–2 bullets, or at least 2 if it has three or more.`,
    "",
    "Fix the model output (or pasted JSON) and try again:",
  ];
  failures.forEach((f) => {
    const jobN = f.jobIndex + 1;
    if (f.reason === "too_few_featured_bullets") {
      lines.push(
        `• Job ${jobN}: only ${f.found} bullet(s) reach ${MIN_WORDS_FEATURED}+ words (need at least ${f.need} for this job’s ${f.bulletCount} bullet(s)).`
      );
      return;
    }
    const bulletN = f.bulletIndex + 1;
    if (f.reason === "empty_bullet") {
      lines.push(`• Job ${jobN}, bullet ${bulletN}: empty line (remove it or add text).`);
    } else {
      lines.push(
        `• Job ${jobN}, bullet ${bulletN}: ${f.wordCount} words (need at least ${f.minWords} for ~two lines).`
      );
      if (f.snippet) lines.push(`  ${f.snippet}`);
    }
  });
  return lines.join("\n");
}
