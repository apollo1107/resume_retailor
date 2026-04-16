import { mongoEnabled } from "@/lib/db/mongo";
import * as fsUsers from "@/server/persistence/users-store-fs";
import * as mongoUsers from "@/server/persistence/users-store-mongo";

export { MAX_ADMINS } from "@/config/auth-limits";

export function userCanAccessProfile(user, resumeName) {
  if (!user || !resumeName) return false;
  if (user.role === "admin") return true;
  const assigned = Array.isArray(user.assignedProfiles) ? user.assignedProfiles : [];
  return assigned.includes(resumeName);
}

export async function findUserByEmail(email) {
  return mongoEnabled() ? mongoUsers.findUserByEmail(email) : fsUsers.findUserByEmail(email);
}

export async function findUserById(id) {
  return mongoEnabled() ? mongoUsers.findUserById(id) : fsUsers.findUserById(id);
}

export async function createUser(email, password) {
  return mongoEnabled() ? mongoUsers.createUser(email, password) : fsUsers.createUser(email, password);
}

export async function verifyUserLogin(email, password) {
  return mongoEnabled() ? mongoUsers.verifyUserLogin(email, password) : fsUsers.verifyUserLogin(email, password);
}

export async function listUsersPublic() {
  return mongoEnabled() ? mongoUsers.listUsersPublic() : fsUsers.listUsersPublic();
}

export async function setUserPasswordById(userId, newPassword) {
  return mongoEnabled()
    ? mongoUsers.setUserPasswordById(userId, newPassword)
    : fsUsers.setUserPasswordById(userId, newPassword);
}

export async function deleteUserById(userId) {
  return mongoEnabled() ? mongoUsers.deleteUserById(userId) : fsUsers.deleteUserById(userId);
}

export async function setUserRoleById(userId, nextRole) {
  return mongoEnabled() ? mongoUsers.setUserRoleById(userId, nextRole) : fsUsers.setUserRoleById(userId, nextRole);
}

export async function setUserAssignedProfilesById(userId, profiles) {
  return mongoEnabled()
    ? mongoUsers.setUserAssignedProfilesById(userId, profiles)
    : fsUsers.setUserAssignedProfilesById(userId, profiles);
}
