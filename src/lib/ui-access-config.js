import fs from "fs";
import path from "path";

const CONFIG_PATH = path.join(process.cwd(), "config", "ui-access.json");

const DEFAULT_CONFIG = {
  showRightSidebar: true,
  urlProfileRules: [],
};

function normalizeConfig(raw) {
  const showRightSidebar =
    raw && typeof raw === "object" && "showRightSidebar" in raw
      ? Boolean(raw.showRightSidebar)
      : true;
  const rules = Array.isArray(raw?.urlProfileRules)
    ? raw.urlProfileRules
        .map((r) => ({
          matchSubstring:
            r && typeof r.matchSubstring === "string" ? r.matchSubstring : "",
          allowedProfileSlugs: Array.isArray(r?.allowedProfileSlugs)
            ? r.allowedProfileSlugs.map((s) => String(s).trim()).filter(Boolean)
            : [],
        }))
        .filter((r) => r.matchSubstring.length > 0)
    : [];
  return { showRightSidebar, urlProfileRules: rules };
}

/**
 * Load `config/ui-access.json` (server-only). Safe defaults if missing or invalid.
 */
export function loadUiAccessConfig() {
  try {
    if (!fs.existsSync(CONFIG_PATH)) return { ...DEFAULT_CONFIG };
    const raw = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
    return normalizeConfig(raw);
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * If the full URL matches a rule's `matchSubstring`, returns allowed profile slugs (Set).
 * First matching rule wins. If no rule matches, returns `null` (no restriction).
 * @param {string} fullUrl
 * @param {Array<{ matchSubstring: string, allowedProfileSlugs: string[] }>} rules
 * @returns {Set<string> | null}
 */
export function allowedSlugsForUrl(fullUrl, rules) {
  if (typeof fullUrl !== "string" || !fullUrl || !Array.isArray(rules)) {
    return null;
  }
  for (const rule of rules) {
    if (!rule?.matchSubstring) continue;
    if (fullUrl.includes(rule.matchSubstring)) {
      return new Set(rule.allowedProfileSlugs || []);
    }
  }
  return null;
}
