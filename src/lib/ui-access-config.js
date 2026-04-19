import fs from "fs";
import path from "path";

const CONFIG_PATH = path.join(process.cwd(), "config", "ui-access.json");

const DEFAULT_CONFIG = {
  urlProfileRules: [],
};

export const ACCESS_RESOLVE_CODE = {
  NO_RULES: "NO_RULES",
  NO_URL: "NO_URL",
  NO_MATCH: "NO_MATCH",
};

function normalizeConfig(raw) {
  const rules = Array.isArray(raw?.urlProfileRules)
    ? raw.urlProfileRules
        .map((r) => ({
          matchSubstring:
            r && typeof r.matchSubstring === "string" ? r.matchSubstring : "",
          allowedProfileSlugs: Array.isArray(r?.allowedProfileSlugs)
            ? r.allowedProfileSlugs.map((s) => String(s).trim()).filter(Boolean)
            : [],
          showRightSidebar:
            r && typeof r === "object" && "showRightSidebar" in r
              ? Boolean(r.showRightSidebar)
              : true,
        }))
        .filter((r) => r.matchSubstring.length > 0)
    : [];
  return { urlProfileRules: rules };
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
 * Resolves access from the full browser URL against `urlProfileRules`.
 * First matching rule wins. If there are no rules, empty URL, or no substring match → not ok (404).
 *
 * @param {string} fullUrl
 * @param {{ urlProfileRules: Array<{ matchSubstring: string, allowedProfileSlugs: string[], showRightSidebar?: boolean }> }} config
 * @returns {{ ok: true, allowedSlugs: Set<string>, showRightSidebar: boolean } | { ok: false, code: string }}
 */
export function resolveUiAccessFromUrl(fullUrl, config) {
  const rules = config?.urlProfileRules;
  if (!Array.isArray(rules) || rules.length === 0) {
    return { ok: false, code: ACCESS_RESOLVE_CODE.NO_RULES };
  }
  if (typeof fullUrl !== "string" || !fullUrl.trim()) {
    return { ok: false, code: ACCESS_RESOLVE_CODE.NO_URL };
  }
  const u = fullUrl;
  for (const rule of rules) {
    if (!rule?.matchSubstring) continue;
    if (u.includes(rule.matchSubstring)) {
      return {
        ok: true,
        allowedSlugs: new Set(rule.allowedProfileSlugs || []),
        showRightSidebar: rule.showRightSidebar !== false,
      };
    }
  }
  return { ok: false, code: ACCESS_RESOLVE_CODE.NO_MATCH };
}
