import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { normalizeEmail, isValidEmail, isValidPassword } from "@/lib/auth/validation";
import { ADMIN_SEED_EMAIL, ADMIN_SEED_PASSWORD } from "@/lib/auth/admin-seed";
import { MAX_ADMINS } from "@/config/auth-limits";

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_PATH = path.join(DATA_DIR, "users.json");
export { MAX_ADMINS };

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readUsersRaw() {
  ensureDataDir();
  if (!fs.existsSync(USERS_PATH)) return { users: [] };
  try {
    const raw = fs.readFileSync(USERS_PATH, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data.users) ? data : { users: [] };
  } catch {
    return { users: [] };
  }
}

function writeUsersRaw(data) {
  ensureDataDir();
  fs.writeFileSync(USERS_PATH, JSON.stringify(data, null, 2), "utf8");
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

export function loadUsers() {
  const data = readUsersRaw();
  if (ensureAdminSeeded(data)) writeUsersRaw(data);
  return data;
}

export function findUserByEmail(email) {
  const n = normalizeEmail(email);
  return loadUsers().users.find((u) => normalizeEmail(u.email) === n) || null;
}

export function findUserById(id) {
  return loadUsers().users.find((u) => u.id === id) || null;
}

export function createUser(email, password) {
  if (!isValidEmail(email)) throw new Error("Invalid email");
  if (!isValidPassword(password)) throw new Error("Invalid password");
  const n = normalizeEmail(email);
  const data = loadUsers();
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
  writeUsersRaw(data);
  return user;
}

export function verifyUserLogin(email, password) {
  const user = findUserByEmail(email);
  if (!user) return null;
  if (!verifyPassword(password, user.passwordSalt, user.passwordHash)) return null;
  return user;
}

export function listUsersPublic() {
  return loadUsers().users.map((u) => ({
    id: u.id,
    email: u.email,
    role: u.role,
    assignedProfiles: Array.isArray(u.assignedProfiles) ? u.assignedProfiles : [],
    createdAt: u.createdAt,
  }));
}

export function setUserPasswordById(userId, newPassword) {
  if (!isValidPassword(newPassword)) throw new Error("Invalid password");
  const data = loadUsers();
  const u = data.users.find((x) => x.id === userId);
  if (!u) throw new Error("User not found");
  const { salt, hash } = hashPassword(newPassword);
  u.passwordSalt = salt;
  u.passwordHash = hash;
  writeUsersRaw(data);
}

export function deleteUserById(userId) {
  const data = loadUsers();
  const u = data.users.find((x) => x.id === userId);
  if (!u) throw new Error("User not found");
  const admins = data.users.filter((x) => x.role === "admin");
  if (u.role === "admin" && admins.length <= 1) {
    throw new Error("Cannot delete the only administrator");
  }
  data.users = data.users.filter((x) => x.id !== userId);
  writeUsersRaw(data);
}

export function setUserRoleById(userId, nextRole) {
  if (nextRole !== "user" && nextRole !== "admin") throw new Error("Invalid role");
  const data = loadUsers();
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
  writeUsersRaw(data);
  return user;
}

export function setUserAssignedProfilesById(userId, profiles) {
  if (!Array.isArray(profiles)) throw new Error("Invalid assigned profiles");
  const clean = [...new Set(profiles.map((p) => String(p).trim()).filter(Boolean))];
  const data = loadUsers();
  const user = data.users.find((x) => x.id === userId);
  if (!user) throw new Error("User not found");
  user.assignedProfiles = clean;
  writeUsersRaw(data);
  return user;
}
