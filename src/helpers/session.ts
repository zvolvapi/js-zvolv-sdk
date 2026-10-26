import { decryptAuthObject, isEncryptedValue } from "./crypto";
import { Session, UserGroupMembership } from "../interfaces/auth.interface";

const ADMIN_ROLES = new Set(["admin", "administrator", "superadmin"]);

/** "Administrator " | "ADMIN" | "super_admin" → "administrator" | "admin" | "superadmin". */
export function normalizeRole(role: any): string {
  if (role === null || role === undefined || isEncryptedValue(role)) return "";
  return String(role).trim().toLowerCase().replace(/[\s_-]+/g, "");
}

/** True for "admin", "ADMIN", "Administrator", "Super Admin" … */
export function isAdminRole(role: any): boolean {
  return ADMIN_ROLES.has(normalizeRole(role));
}

const readable = (v: any): any => (isEncryptedValue(v) ? undefined : v);

const toId = (v: any): number | null => {
  const n = Number(readable(v));
  return Number.isFinite(n) && n > 0 ? n : null;
};

/** The raw role string of a stored/login user object. */
export function roleOf(u: any): string {
  const r =
    readable(u?.profile?.role_details?.role) ??
    readable(u?.role_details?.role) ??
    readable(u?.role) ??
    readable(u?.profile?.role);
  return r === undefined || r === null ? "" : String(r);
}

/**
 * Builds the normalised Session from a user object (login response, stored session or
 * client.auth.userInstance). Encrypted values are decrypted when the key is available
 * and left out otherwise — `ready` then stays false.
 */
export function buildSession(user: any, memberships: UserGroupMembership[] = []): Session {
  const u = user ? decryptAuthObject(user) : null;
  const userId =
    toId(u?.userId) ?? toId(u?.UserID) ?? toId(u?.user_id) ?? toId(u?.id) ?? toId(u?.profile?.id) ?? toId(u?.profile?.userId);
  const groupId =
    toId(u?.userGroupId) ?? toId(u?.UserGroupID) ?? toId(u?.profile?.userGroupId) ?? toId(u?.groupId) ?? toId(u?.GroupID);
  const role = roleOf(u);
  const groupIds: number[] = [];
  const add = (g: any) => {
    const n = toId(g);
    if (n !== null && !groupIds.includes(n)) groupIds.push(n);
  };
  add(groupId);
  memberships.forEach((m) => add(m?.groupId));
  return {
    userId,
    name: String(readable(u?.profile?.name) ?? readable(u?.name) ?? readable(u?.Title) ?? ""),
    email: String(readable(u?.email) ?? readable(u?.Email) ?? readable(u?.profile?.email) ?? ""),
    role,
    isAdmin: isAdminRole(role),
    groupId,
    groupIds,
    // Ready once the fields a session is built from are readable.
    ready:
      !!u &&
      ![u.userId, u.userGroupId, u.name, u.email, u.role, u.profile?.name, u.profile?.role_details?.role].some(isEncryptedValue),
  };
}
