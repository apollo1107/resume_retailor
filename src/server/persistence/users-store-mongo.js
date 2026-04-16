import { randomUUID } from "crypto";
import { getMongoDb } from "@/lib/db/mongo";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { normalizeEmail, isValidEmail, isValidPassword } from "@/lib/auth/validation";
import { ADMIN_SEED_EMAIL, ADMIN_SEED_PASSWORD } from "@/lib/auth/admin-seed";
import { MAX_ADMINS } from "@/config/auth-limits";

let indexesReady = false;

async function usersColl() {
  const db = await getMongoDb();
  const c = db.collection("users");
  if (!indexesReady) {
    await c.createIndex({ id: 1 }, { unique: true });
    await c.createIndex({ email: 1 }, { unique: true });
    indexesReady = true;
    await ensureAdminSeededOnce(c);
  }
  return c;
}

async function ensureAdminSeededOnce(c) {
  const email = normalizeEmail(ADMIN_SEED_EMAIL);
  const exists = await c.findOne({ email });
  if (exists) return;
  const { salt, hash } = hashPassword(ADMIN_SEED_PASSWORD);
  await c.insertOne({
    id: randomUUID(),
    email,
    passwordSalt: salt,
    passwordHash: hash,
    role: "admin",
    assignedProfiles: [],
    createdAt: new Date().toISOString(),
  });
}

export async function findUserByEmail(email) {
  const n = normalizeEmail(email);
  const c = await usersColl();
  return (await c.findOne({ email: n })) || null;
}

export async function findUserById(id) {
  const c = await usersColl();
  return (await c.findOne({ id })) || null;
}

export async function createUser(email, password) {
  if (!isValidEmail(email)) throw new Error("Invalid email");
  if (!isValidPassword(password)) throw new Error("Invalid password");
  const n = normalizeEmail(email);
  const c = await usersColl();
  const dup = await c.findOne({ email: n });
  if (dup) throw new Error("Email already registered");
  const { salt, hash } = hashPassword(password);
  const user = {
    id: randomUUID(),
    email: n,
    passwordSalt: salt,
    passwordHash: hash,
    role: "user",
    assignedProfiles: [],
    createdAt: new Date().toISOString(),
  };
  await c.insertOne(user);
  return user;
}

export async function verifyUserLogin(email, password) {
  const user = await findUserByEmail(email);
  if (!user) return null;
  if (!verifyPassword(password, user.passwordSalt, user.passwordHash)) return null;
  return user;
}

export async function listUsersPublic() {
  const c = await usersColl();
  const rows = await c.find({}).sort({ email: 1 }).toArray();
  return rows.map((u) => ({
    id: u.id,
    email: u.email,
    role: u.role,
    assignedProfiles: Array.isArray(u.assignedProfiles) ? u.assignedProfiles : [],
    createdAt: u.createdAt,
  }));
}

export async function setUserPasswordById(userId, newPassword) {
  if (!isValidPassword(newPassword)) throw new Error("Invalid password");
  const { salt, hash } = hashPassword(newPassword);
  const c = await usersColl();
  const r = await c.updateOne({ id: userId }, { $set: { passwordSalt: salt, passwordHash: hash } });
  if (r.matchedCount === 0) throw new Error("User not found");
}

export async function deleteUserById(userId) {
  const c = await usersColl();
  const u = await c.findOne({ id: userId });
  if (!u) throw new Error("User not found");
  const adminCount = await c.countDocuments({ role: "admin" });
  if (u.role === "admin" && adminCount <= 1) {
    throw new Error("Cannot delete the only administrator");
  }
  await c.deleteOne({ id: userId });
}

export async function setUserRoleById(userId, nextRole) {
  if (nextRole !== "user" && nextRole !== "admin") throw new Error("Invalid role");
  const c = await usersColl();
  const user = await c.findOne({ id: userId });
  if (!user) throw new Error("User not found");
  if (user.role === nextRole) return user;

  if (nextRole === "admin") {
    const adminCount = await c.countDocuments({ role: "admin" });
    if (adminCount >= MAX_ADMINS) {
      throw new Error(`Maximum ${MAX_ADMINS} administrators allowed`);
    }
  } else {
    const adminCount = await c.countDocuments({ role: "admin" });
    if (user.role === "admin" && adminCount <= 1) {
      throw new Error("Cannot remove the only administrator");
    }
  }

  await c.updateOne({ id: userId }, { $set: { role: nextRole } });
  return { ...user, role: nextRole };
}

export async function setUserAssignedProfilesById(userId, profiles) {
  if (!Array.isArray(profiles)) throw new Error("Invalid assigned profiles");
  const clean = [...new Set(profiles.map((p) => String(p).trim()).filter(Boolean))];
  const c = await usersColl();
  const r = await c.updateOne({ id: userId }, { $set: { assignedProfiles: clean } });
  if (r.matchedCount === 0) throw new Error("User not found");
  return await findUserById(userId);
}
