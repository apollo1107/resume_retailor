import { randomUUID } from "crypto";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { normalizeEmail, isValidEmail, isValidPassword } from "@/lib/auth/validation";
import { ADMIN_SEED_EMAIL, ADMIN_SEED_PASSWORD } from "@/lib/auth/admin-seed";
import { MAX_ADMINS } from "@/config/auth-limits";
import { getRedis } from "@/server/persistence/redis-client";

const USERS_KEY = "resume_retailor:users:v1";

function parseDoc(raw) {
  if (raw == null) return { users: [] };
  if (typeof raw === "string") {
    try {
      const data = JSON.parse(raw);
      return Array.isArray(data.users) ? data : { users: [] };
    } catch {
      return { users: [] };
    }
  }
  if (typeof raw === "object" && Array.isArray(raw.users)) return raw;
  return { users: [] };
}

async function readRaw() {
  const r = getRedis();
  const raw = await r.get(USERS_KEY);
  return parseDoc(raw);
}

async function writeRaw(data) {
  const r = getRedis();
  await r.set(USERS_KEY, JSON.stringify(data));
}

function ensureAdminSeeded(data) {
  const email = normalizeEmail(ADMIN_SEED_EMAIL);
  const idx = data.users.findIndex((u) => normalizeEmail(u.email) === email);
  if (idx !== -1) return false;
  const { salt, hash } = hashPassword(ADMIN_SEED_PASSWORD);
  data.users.push({
    id: randomUUID(),
    email,
    passwordSalt: salt,
    passwordHash: hash,
    role: "admin",
    assignedProfiles: [],
    createdAt: new Date().toISOString(),
  });
  return true;
}

async function loadUsers() {
  const data = await readRaw();
  if (ensureAdminSeeded(data)) await writeRaw(data);
  return data;
}

export async function findUserByEmail(email) {
  const n = normalizeEmail(email);
  const { users } = await loadUsers();
  return users.find((u) => normalizeEmail(u.email) === n) || null;
}

export async function findUserById(id) {
  const { users } = await loadUsers();
  return users.find((u) => u.id === id) || null;
}

export async function createUser(email, password) {
  if (!isValidEmail(email)) throw new Error("Invalid email");
  if (!isValidPassword(password)) throw new Error("Invalid password");
  const n = normalizeEmail(email);
  const data = await loadUsers();
  if (data.users.some((u) => normalizeEmail(u.email) === n)) {
    throw new Error("Email already registered");
  }
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
  data.users.push(user);
  await writeRaw(data);
  return user;
}

export async function verifyUserLogin(email, password) {
  const user = await findUserByEmail(email);
  if (!user) return null;
  if (!verifyPassword(password, user.passwordSalt, user.passwordHash)) return null;
  return user;
}

export async function listUsersPublic() {
  const { users } = await loadUsers();
  return users.map((u) => ({
    id: u.id,
    email: u.email,
    role: u.role,
    assignedProfiles: Array.isArray(u.assignedProfiles) ? u.assignedProfiles : [],
    createdAt: u.createdAt,
  }));
}

export async function setUserPasswordById(userId, newPassword) {
  if (!isValidPassword(newPassword)) throw new Error("Invalid password");
  const data = await loadUsers();
  const u = data.users.find((x) => x.id === userId);
  if (!u) throw new Error("User not found");
  const { salt, hash } = hashPassword(newPassword);
  u.passwordSalt = salt;
  u.passwordHash = hash;
  await writeRaw(data);
}

export async function deleteUserById(userId) {
  const data = await loadUsers();
  const u = data.users.find((x) => x.id === userId);
  if (!u) throw new Error("User not found");
  const admins = data.users.filter((x) => x.role === "admin");
  if (u.role === "admin" && admins.length <= 1) {
    throw new Error("Cannot delete the only administrator");
  }
  data.users = data.users.filter((x) => x.id !== userId);
  await writeRaw(data);
}

export async function setUserRoleById(userId, nextRole) {
  if (nextRole !== "user" && nextRole !== "admin") throw new Error("Invalid role");
  const data = await loadUsers();
  const user = data.users.find((x) => x.id === userId);
  if (!user) throw new Error("User not found");
  if (user.role === nextRole) return user;

  if (nextRole === "admin") {
    const adminCount = data.users.filter((x) => x.role === "admin").length;
    if (adminCount >= MAX_ADMINS) {
      throw new Error(`Maximum ${MAX_ADMINS} administrators allowed`);
    }
  } else {
    const adminCount = data.users.filter((x) => x.role === "admin").length;
    if (user.role === "admin" && adminCount <= 1) {
      throw new Error("Cannot remove the only administrator");
    }
  }

  user.role = nextRole;
  await writeRaw(data);
  return user;
}

export async function setUserAssignedProfilesById(userId, profiles) {
  if (!Array.isArray(profiles)) throw new Error("Invalid assigned profiles");
  const clean = [...new Set(profiles.map((p) => String(p).trim()).filter(Boolean))];
  const data = await loadUsers();
  const user = data.users.find((x) => x.id === userId);
  if (!user) throw new Error("User not found");
  user.assignedProfiles = clean;
  await writeRaw(data);
  return user;
}
