import { listUsersPublic } from "@/server/persistence/users-store";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const users = await listUsersPublic();
  return res.status(200).json({ users });
}
