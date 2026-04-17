export function trackDownload(kind) {
  if (kind !== "cv" && kind !== "cover") return;
  fetch("/api/track-download", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind }),
  }).catch(() => {});
}
