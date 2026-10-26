import CryptoJS from "crypto-js";
import { isBrowser } from "./client";

const DEVICE_KEY_SLOT = "zvDeviceKey";
const PREFIX = "enc::";
const TAG_D = "d::";
const TAG_S = "s::";

const USER_SLOT = "user";
const AKITA_SLOT = "AkitaStores";

export const AUTH_CRYPT_READY_EVENT = "zvAuthCryptReady";

const SESSION_FIELDS = ["AuthKey", "loginToken", "sharedToken"];
const PII_FIELDS = [
  "email",
  "Email",
  "name",
  "Title",
  "username",
  "role",
  "userId",
  "UserID",
  "userGroupId",
  "UserGroupID",
  "groupId",
  "GroupID",
];
const NUMERIC_FIELDS = [
  "userId",
  "UserID",
  "userGroupId",
  "UserGroupID",
  "groupId",
  "GroupID",
];

let serverKey: string | null = null;

export function getDeviceKey(): string {
  if (!isBrowser) return "";
  let key = localStorage.getItem(DEVICE_KEY_SLOT);
  if (!key) {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    key = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    localStorage.setItem(DEVICE_KEY_SLOT, key);
  }
  return key;
}

export const setServerKey = (key: string | null): void => {
  serverKey = key;
};

export const getServerKey = (): string | null => serverKey;

function encryptWith(value: any, key: string, tag: string): any {
  if (value === null || value === undefined || value === "") return value;
  if (typeof value !== "string" && typeof value !== "number") return value;
  if (typeof value === "string" && value.startsWith(PREFIX)) return value;
  if (!key) return value;
  return PREFIX + tag + CryptoJS.AES.encrypt(String(value), key).toString();
}

function tryDecrypt(cipher: string, key: string): string | null {
  try {
    const plain = CryptoJS.AES.decrypt(cipher, key).toString(CryptoJS.enc.Utf8);
    return plain || null;
  } catch {
    return null;
  }
}

export const encryptSession = (value: any): any =>
  encryptWith(value, getDeviceKey(), TAG_D);

export const encryptPii = (value: any): any => {
  const key = getServerKey();
  return key
    ? encryptWith(value, key, TAG_S)
    : encryptWith(value, getDeviceKey(), TAG_D);
};

/**
 * Decrypts one stored session value.
 *
 * Contract:
 * - A value that is already readable (plain string, number, boolean, null, object)
 *   is returned unchanged. The stored session mixes `enc::…` and plain fields
 *   depending on when it was last written, so callers can run every field through this.
 * - `enc::d::…` is decrypted with this browser's device key.
 * - `enc::s::…` is decrypted with the server key (AUTH_CRYPT). Until that key has been
 *   fetched the ciphertext is returned unchanged — check `isReadable()` or await
 *   `client.auth.ready()` before relying on such a field.
 * - Untagged `enc::…` (older data) is tried with the server key, then the device key
 *   (same as zvolv-web's EncryptionService).
 */
export function decryptValue(value: any): any {
  if (typeof value !== "string" || !value.startsWith(PREFIX)) return value;
  const body = value.slice(PREFIX.length);
  if (body.startsWith(TAG_D)) {
    const plain = tryDecrypt(body.slice(TAG_D.length), getDeviceKey());
    return plain !== null ? plain : value;
  }
  if (body.startsWith(TAG_S)) {
    const key = getServerKey();
    if (!key) return value;
    const plain = tryDecrypt(body.slice(TAG_S.length), key);
    return plain !== null ? plain : value;
  }
  // Legacy untagged ciphertext: best effort with both keys.
  const server = getServerKey();
  if (server) {
    const plain = tryDecrypt(body, server);
    if (plain !== null) return plain;
  }
  const device = getDeviceKey();
  if (device) {
    const plain = tryDecrypt(body, device);
    if (plain !== null) return plain;
  }
  return value;
}

export const isEncryptedValue = (value: any): boolean =>
  typeof value === "string" && value.startsWith(PREFIX);

/** True when a value can be shown or compared as-is (it is not, or no longer, `enc::…`). */
export const isReadable = (value: any): boolean => !isEncryptedValue(value);

/** True when any field of an object (deeply) is still `enc::…`. */
export function hasEncryptedFields(node: any): boolean {
  if (Array.isArray(node)) return node.some(hasEncryptedFields);
  if (node && typeof node === "object") return Object.values(node).some(hasEncryptedFields);
  return isEncryptedValue(node);
}

/**
 * Field-by-field merge of two copies of the same user: a readable value in either
 * copy wins over ciphertext, so a plain in-memory field is never replaced by an
 * `enc::…` one read back from storage.
 */
export function mergeReadable<T>(primary: T, fallback: any): T {
  if (fallback === undefined || fallback === null) return primary;
  if (primary === undefined || primary === null) return fallback;
  if (Array.isArray(primary)) return primary;
  if (typeof primary === "object" && typeof fallback === "object" && !Array.isArray(fallback)) {
    const out: Record<string, any> = { ...fallback };
    for (const [k, v] of Object.entries(primary as any)) out[k] = mergeReadable(v, (fallback as any)[k]);
    return out as T;
  }
  if (isEncryptedValue(primary) && !isEncryptedValue(fallback)) return fallback;
  return primary;
}

function walkObject(
  node: any,
  transform: (key: string, value: any) => any
): any {
  if (Array.isArray(node)) {
    return node.map((item) => walkObject(item, transform));
  }
  if (node && typeof node === "object") {
    const out: Record<string, any> = {};
    for (const [key, value] of Object.entries(node)) {
      if (value && typeof value === "object") {
        out[key] = walkObject(value, transform);
      } else {
        out[key] = transform(key, value);
      }
    }
    return out;
  }
  return node;
}

export function encryptAuthObject<T>(data: T): T {
  if (!data || typeof data !== "object") return data;
  return walkObject(data, (key, value) => {
    if (SESSION_FIELDS.includes(key)) return encryptSession(value);
    if (PII_FIELDS.includes(key)) return encryptPii(value);
    return value;
  });
}

export function decryptAuthObject<T>(data: T): T {
  if (!data || typeof data !== "object") return data;
  return walkObject(data, (key, value) => {
    const plain = decryptValue(value);
    if (
      plain !== value &&
      NUMERIC_FIELDS.includes(key) &&
      typeof plain === "string" &&
      plain !== "" &&
      !isNaN(Number(plain))
    ) {
      return Number(plain);
    }
    return plain;
  });
}

export function persistUserToStorage(data: any): void {
  if (!isBrowser || !data || typeof data !== "object") return;
  const encrypted = encryptAuthObject(data);
  localStorage.setItem(USER_SLOT, JSON.stringify(encrypted));
  let stores: Record<string, any> = {};
  try {
    const raw = localStorage.getItem(AKITA_SLOT);
    stores = raw ? JSON.parse(raw) : {};
  } catch {
    stores = {};
  }
  stores.auth = encrypted;
  localStorage.setItem(AKITA_SLOT, JSON.stringify(stores));
}

export function readUserFromStorage(): any | null {
  if (!isBrowser) return null;
  let user: any = null;
  try {
    const raw = localStorage.getItem(USER_SLOT);
    user = raw ? JSON.parse(raw) : null;
  } catch {
    user = null;
  }
  if (!user || typeof user !== "object") {
    try {
      const raw = localStorage.getItem(AKITA_SLOT);
      const stores = raw ? JSON.parse(raw) : null;
      user = stores?.auth ?? stores?.Auth ?? stores?.authStore ?? null;
    } catch {
      user = null;
    }
  }
  if (!user || typeof user !== "object" || Object.keys(user).length === 0) {
    return null;
  }
  return decryptAuthObject(user);
}

export function upgradeStoredPii(): void {
  const user = readUserFromStorage();
  if (user) persistUserToStorage(user);
}

export function notifyAuthCryptReady(): void {
  if (isBrowser && typeof window.dispatchEvent === "function") {
    window.dispatchEvent(new CustomEvent(AUTH_CRYPT_READY_EVENT));
  }
}
