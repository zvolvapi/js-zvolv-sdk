export interface User {
    loginToken: string;
    userId:   number;
    name:   string;
    email:   string;
    userGroupId?: number;
    sharedToken?:string
    message?: string; // Optional message field for errors or additional info
}

/** A user group (role) the user belongs to. */
export interface UserGroupMembership {
    groupId: number;
    title: string;
}

/**
 * The signed-in user, decrypted and normalised — read this instead of parsing the
 * stored user. From `client.auth.session` (sync) or `await client.auth.loadSession()`.
 */
export interface Session {
    userId: number | null;
    name: string;
    email: string;
    /** The role as the server sent it ("admin", "ADMIN", "Administrator", "builder"…). */
    role: string;
    /** True for admin / Administrator / super admin, in any case. */
    isAdmin: boolean;
    /** The user's own user group. */
    groupId: number | null;
    /** groupId plus every group the user is a member of (filled by loadSession()). */
    groupIds: number[];
    /** False while some fields are still encrypted (server key not loaded yet). */
    ready: boolean;
}
