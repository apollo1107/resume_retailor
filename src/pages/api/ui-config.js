import { loadUiAccessConfig } from "@/lib/ui-access-config";

export default function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const cfg = loadUiAccessConfig();
  res.status(200).json({
    showRightSidebar: cfg.showRightSidebar !== false,
  });
}
