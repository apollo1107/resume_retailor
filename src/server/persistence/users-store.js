import { mongoEnabled } from "@/lib/db/mongo";
import * as fsUsers from "@/server/persistence/users-store-fs";
import * as mongoUsers from "@/server/persistence/users-store-mongo";

export { MAX_ADMINS } from "@/config/auth-limits";

export async function findUserById(id) {
  return mongoEnabled() ? mongoUsers.findUserById(id) : fsUsers.findUserById(id);
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
