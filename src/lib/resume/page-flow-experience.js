/**
 * Export-only tweaks so a job title row is less likely to sit alone at a page foot
 * while the company line + bullets start on the next page.
 *
 * Does not edit profile JSON. May split one existing long bullet into two lines
 * (same facts, sentence boundary) to add vertical slack before the next role.
 */

function wordCount(s) {
  return String(s ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

/**
 * If the first role has a very long bullet, split it at ". " after ~half the words
 * so the block before the next job header is slightly taller (helps PDF/DOCX flow).
 */
export function splitLongestDetailInFirstRoleForPageFlow(mergedDetails) {
  if (!Array.isArray(mergedDetails) || mergedDetails.length < 2) {
    return mergedDetails;
  }
  const first = mergedDetails[0];
  if (!Array.isArray(first) || first.length < 2) return mergedDetails;

  let bestIdx = -1;
  let bestWords = 0;
  first.forEach((line, i) => {
    const w = wordCount(line);
    if (w > bestWords) {
      bestWords = w;
      bestIdx = i;
    }
  });
  if (bestIdx < 0 || bestWords < 80) return mergedDetails;

  const text = String(first[bestIdx]).trim();
  const target = Math.floor(bestWords / 2);
  let words = 0;
  let splitAt = -1;
  for (let i = 0; i < text.length; i++) {
    if (i > 0 && /\s/.test(text[i]) && !/\s/.test(text[i - 1])) words += 1;
    if (words >= Math.max(36, target) && text.slice(i, i + 2) === ". ") {
      splitAt = i + 1;
      break;
    }
  }
  if (splitAt === -1) return mergedDetails;

  const part1 = text.slice(0, splitAt).trim();
  const part2 = text.slice(splitAt + 1).trim();
  if (wordCount(part1) < 30 || wordCount(part2) < 30) return mergedDetails;

  const nextFirst = [...first];
  nextFirst.splice(bestIdx, 1, part1, part2);
  return [nextFirst, ...mergedDetails.slice(1)];
}
