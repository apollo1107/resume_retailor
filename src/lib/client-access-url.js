/**
 * Query segment for APIs that enforce `config/ui-access.json` URL rules.
 * Uses the full current URL (including hash) so fragments like `#...` match.
 */
export function getAccessUrlQuery() {
  if (typeof window === "undefined") return "";
  try {
    return `accessUrl=${encodeURIComponent(window.location.href)}`;
  } catch {
    return "";
  }
}
