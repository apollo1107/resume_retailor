import * as fsUsers from "@/server/persistence/users-store-fs";
import * as redisUsers from "@/server/persistence/users-store-redis";
import { assertPersistenceAvailable, persistenceRedisEnabled } from "@/server/persistence/redis-client";

export { MAX_ADMINS } from "@/config/auth-limits";

export function userCanAccessProfile(user, resumeName) {
  if (!user || !resumeName) return false;
  if (user.role === "admin") return true;
  const assigned = Array.isArray(user.assignedProfiles) ? user.assignedProfiles : [];
  return assigned.includes(resumeName);
}

export async function findUserByEmail(email) {
  if (persistenceRedisEnabled()) return redisUsers.findUserByEmail(email);
  assertPersistenceAvailable();
  return fsUsers.findUserByEmail(email);
}

export async function findUserById(id) {
  if (persistenceRedisEnabled()) return redisUsers.findUserById(id);
  assertPersistenceAvailable();
  return fsUsers.findUserById(id);
}

export async function createUser(email, password) {
  if (persistenceRedisEnabled()) return redisUsers.createUser(email, password);
  assertPersistenceAvailable();
  return fsUsers.createUser(email, password);
}

export async function verifyUserLogin(email, password) {
  if (persistenceRedisEnabled()) return redisUsers.verifyUserLogin(email, password);
  assertPersistenceAvailable();
  return fsUsers.verifyUserLogin(email, password);
}

export async function listUsersPublic() {
  if (persistenceRedisEnabled()) return redisUsers.listUsersPublic();
  assertPersistenceAvailable();
  return fsUsers.listUsersPublic();
}

export async function setUserPasswordById(userId, newPassword) {
  if (persistenceRedisEnabled()) return redisUsers.setUserPasswordById(userId, newPassword);
  assertPersistenceAvailable();
  return fsUsers.setUserPasswordById(userId, newPassword);
}

export async function deleteUserById(userId) {
  if (persistenceRedisEnabled()) return redisUsers.deleteUserById(userId);
  assertPersistenceAvailable();
  return fsUsers.deleteUserById(userId);
}

export async function setUserRoleById(userId, nextRole) {
  if (persistenceRedisEnabled()) return redisUsers.setUserRoleById(userId, nextRole);
  assertPersistenceAvailable();
  return fsUsers.setUserRoleById(userId, nextRole);
}

export async function setUserAssignedProfilesById(userId, profiles) {
  if (persistenceRedisEnabled()) return redisUsers.setUserAssignedProfilesById(userId, profiles);
  assertPersistenceAvailable();
  return fsUsers.setUserAssignedProfilesById(userId, profiles);
}
