import * as fsUsers from "@/server/persistence/users-store-fs";

export { MAX_ADMINS } from "@/config/auth-limits";

export function userCanAccessProfile(user, resumeName) {
  if (!user || !resumeName) return false;
  if (user.role === "admin") return true;
  const assigned = Array.isArray(user.assignedProfiles) ? user.assignedProfiles : [];
  return assigned.includes(resumeName);
}

export async function findUserByEmail(email) {
  return fsUsers.findUserByEmail(email);
}

export async function findUserById(id) {
  return fsUsers.findUserById(id);
}

export async function createUser(email, password) {
  return fsUsers.createUser(email, password);
}

export async function verifyUserLogin(email, password) {
  return fsUsers.verifyUserLogin(email, password);
}

export async function listUsersPublic() {
  return fsUsers.listUsersPublic();
}

export async function setUserPasswordById(userId, newPassword) {
  return fsUsers.setUserPasswordById(userId, newPassword);
}

export async function deleteUserById(userId) {
  return fsUsers.deleteUserById(userId);
}

export async function setUserRoleById(userId, nextRole) {
  return fsUsers.setUserRoleById(userId, nextRole);
}

export async function setUserAssignedProfilesById(userId, profiles) {
  return fsUsers.setUserAssignedProfilesById(userId, profiles);
}
