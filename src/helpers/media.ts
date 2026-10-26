/**
 * Media (file upload) helpers.
 *
 * Upload:   POST /api/v1/media/upload  (multipart, field "file") — same endpoint as zvolv-web.
 * Response: { error: false, data: { mediaKey, mediaName, mediaType, mediaSize, … } }.
 *           `data` is exactly what a file field stores (zvolv-web stores it as-is).
 * Download: GET  {origin}/media/{businessDomain}/{mediaKey}[?jwt=<loginToken>]
 *           The `jwt` query is needed only on workspaces whose AUTHENTICATION is "PRIVATE".
 */

/**
 * Extensions the platform refuses. Mirrors zvolv-web's BLOCKED_FILE_EXTENSIONS,
 * plus "zip", which the media API rejects server-side.
 */
export const BLOCKED_UPLOAD_EXTENSIONS: readonly string[] = Object.freeze(Array.from(new Set([
  "ade", "adp", "app", "application", "appref-ms", "asp", "aspx", "asx",
  "bas", "bat", "bgi", "cab", "cer", "chm", "cmd", "cnt", "com", "cpl",
  "crt", "csh", "der", "diagcab", "exe", "fxp", "gadget", "grp", "hlp",
  "hpj", "hta", "htc", "inf", "ins", "iso", "isp", "its", "jar", "jnlp",
  "js", "jse", "ksh", "lnk", "mad", "maf", "mag", "mam", "maq", "mar",
  "mas", "mat", "mau", "mav", "maw", "mcf", "mda", "mdb", "mde", "mdt",
  "mdw", "mdz", "msc", "msh", "msh1", "msh2", "mshxml", "msh1xml",
  "msh2xml", "msi", "msp", "mst", "msu", "ops", "osd", "pcd", "pif",
  "pl", "plg", "prf", "ps1", "ps1xml", "ps2", "ps2xml", "psc1", "psc2",
  "reg", "scr", "scf", "sln", "vbs", "vb", "vbe", "ws", "wsf", "wsc",
  "wsh", "z", "bz2", "ace", "ppkg", "bak", "tmp", "ost", "pst", "pkg",
  "vhd", "vhdx", "lock", "lck", "cs", "csproj", "resx", "config",
  "resources", "pdb", "manifest", "dot", "wbk",
  "xlt", "xlm", "xla", "pot", "pps",
  "cdb", "mdn", "sh", "php", "mdf", "ldb", "wps", "xlam",
  "xll", "xlw", "ppam",
  // refused by the media API itself
  "zip",
])));

/** Lower-case extension of a file name, without the dot ("" when there is none). */
export function fileExtension(name: string | undefined | null): string {
  const n = String(name ?? "");
  const i = n.lastIndexOf(".");
  return i > 0 && i < n.length - 1 ? n.slice(i + 1).toLowerCase() : "";
}

/** True when the platform will refuse a file with this name. */
export function isBlockedUpload(name: string | undefined | null): boolean {
  const ext = fileExtension(name);
  return !!ext && BLOCKED_UPLOAD_EXTENSIONS.includes(ext);
}

/** Anything that names a stored file: a mediaKey, a stored file object, or a full URL. */
export type MediaRef =
  | string
  | { mediaKey?: string; media_key?: string; key?: string; url?: string; media?: string }
  | null
  | undefined;

/** The mediaKey inside a reference ("" when there is none). Full URLs return "". */
export function mediaKeyOf(ref: MediaRef): string {
  if (!ref) return "";
  if (typeof ref === "string") return /^https?:\/\//i.test(ref) ? "" : ref.trim();
  return String(ref.mediaKey ?? ref.media_key ?? ref.key ?? "").trim();
}

/**
 * {origin}/media/{domain}/{mediaKey}[?jwt=token].
 * A full http(s) URL (or an object whose url/media is one) is returned unchanged.
 * Returns "" when there is nothing to point at.
 */
export function buildMediaUrl(
  origin: string,
  domain: string,
  ref: MediaRef,
  token?: string | null
): string {
  if (typeof ref === "string" && /^https?:\/\//i.test(ref)) return ref;
  if (ref && typeof ref === "object") {
    const direct = ref.url ?? ref.media;
    if (!mediaKeyOf(ref) && typeof direct === "string" && /^https?:\/\//i.test(direct)) return direct;
  }
  const key = mediaKeyOf(ref);
  if (!key || !domain) return "";
  const base = String(origin ?? "").replace(/\/+$/, "");
  const url = `${base}/media/${encodeURIComponent(domain)}/${key.split("/").map(encodeURIComponent).join("/")}`;
  return token ? `${url}?jwt=${encodeURIComponent(token)}` : url;
}

/** Progress reported by mediaUpload: bytes sent so far, total bytes, 0–100. */
export interface UploadProgress {
  loaded: number;
  total: number;
  percent: number;
}

export interface MediaUploadOptions {
  /** Zapp the file belongs to (sent as ?zapid=). */
  zappId?: string | number;
  /** Called on each real XHR `progress` event of the upload body. */
  onProgress?: (p: UploadProgress) => void;
  /** Cancels the upload; the promise then rejects with an AbortError-style error. */
  signal?: AbortSignal;
  /** Skip the client-side blocked-extension check (the server still refuses them). */
  skipExtensionCheck?: boolean;
}

/** What the server stores for an uploaded file (`response.data`). */
export interface UploadedMedia {
  mediaKey: string;
  mediaName?: string;
  mediaType?: string;
  mediaSize?: number;
  [k: string]: any;
}

/** The result of mediaUpload. */
export interface MediaUploadResult {
  /** Always false on a resolved promise (kept for callers that read `res.error`). */
  error: false;
  message?: string;
  /** Exactly what the server returned as `data` — store this in the file field. */
  data: UploadedMedia;
  /** Same as data.mediaKey; never empty on a resolved promise. */
  mediaKey: string;
  /** Download URL without a token — safe to store or log. */
  url: string;
  /** URL to show the file now (carries ?jwt= on PRIVATE workspaces). Don't store it. */
  previewUrl: string;
}
