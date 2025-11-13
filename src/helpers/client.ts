// Check if cloent is browser
export const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';

// Check if client is node server
export const isServer = typeof process !== 'undefined' && process.versions != null && process.versions.node != null;

export const getClientType = (): "browser" | "server" => {
  return isBrowser ? "browser" : "server";
};

export const createApiUrl = (
  path: string,
  embeddedParams?: Record<string, any> | Array<Record<string, any>> | null,
  urlParams?: Record<string, any> | null,
  queryParams?: Record<string, any> | null
): string => {
  let url = path;

  // Support both object and array for embeddedParams
  if (embeddedParams) {
    const paramsArray = Array.isArray(embeddedParams)
      ? embeddedParams
      : [embeddedParams];

    paramsArray.forEach((params) => {
      Object.entries(params).forEach(([key, value]) => {
        url = url.replace(`:${key}`, encodeURIComponent(String(value)));
      });
    });
  }

  // Append URL params (like /id/value)
  if (urlParams) {
    Object.entries(urlParams).forEach(([key, value]) => {
      url += `/${encodeURIComponent(String(value))}`;
    });
  }

  // Append query params
  if (queryParams) {
    const queryString = Object.entries(queryParams)
      .map(
        ([key, value]) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`
      )
      .join("&");
    if (queryString) {
      url += (url.includes("?") ? "&" : "?") + queryString;
    }
  }

  return url;
};

export function createBifrostUrl(
  relativeUrl: string,
  embeddedParams?: Record<string, any> | null,
  urlParams?: Record<string, any> | null,
  queryParams?: Record<string, any> | null,
  version: number = 1
): string {
  const url = createApiUrl(relativeUrl, embeddedParams, urlParams, queryParams);
  return `/api/v${version}/${url.replace(/^\/+/, "")}`;
}

export const getParsedLocalStorageItem = <T>(
  key: string,
  defaultValue: T
): T => {
  try {
    const item = isBrowser ? localStorage.getItem(key) : null;
    return item ? (JSON.parse(item) as T) : defaultValue;
  } catch (error) {
    console.error(`Error parsing localStorage item for key "${key}":`, error);
    return defaultValue;
  }
};