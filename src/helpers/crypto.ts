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
  return value;
}

export const isEncryptedValue = (value: any): boolean =>
  typeof value === "string" && value.startsWith(PREFIX);

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
