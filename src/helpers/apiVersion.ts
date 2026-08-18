export const LEGACY_API_VERSION = "v17";
export const ODIN_API_VERSION = "v1";

let odinEnabledOverride: boolean | null = null;

const parseFlag = (value: unknown): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") return /^(true|1|yes|on)$/i.test(value.trim());
  return false;
};

export const setOdinEnabled = (enabled: unknown): void => {
  odinEnabledOverride = parseFlag(enabled);
};

export const isOdinEnabled = (): boolean => {
  if (odinEnabledOverride !== null) return odinEnabledOverride;
  try {
    const config =
      typeof window !== "undefined" ? (window as any).APP_CONFIG : undefined;
    if (config && config.ODIN_ENABLED !== undefined) {
      return parseFlag(config.ODIN_ENABLED);
    }
  } catch {
    return false;
  }
  return false;
};

export const legacyApiVersion = (): string =>
  isOdinEnabled() ? ODIN_API_VERSION : LEGACY_API_VERSION;

export const legacyApiPrefix = (): string => `/rest/${legacyApiVersion()}`;

const LEGACY_PREFIX_PATTERN = new RegExp(
  `/rest/${LEGACY_API_VERSION}(?=[/?#]|$)`
);

export const resolveApiVersion = (url?: string | null): string => {
  if (!url || !isOdinEnabled()) return url ?? "";
  return url.replace(LEGACY_PREFIX_PATTERN, `/rest/${ODIN_API_VERSION}`);
};
