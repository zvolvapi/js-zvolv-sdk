// Check if cloent is browser
export const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';

// Check if client is node server
export const isServer = typeof process !== 'undefined' && process.versions != null && process.versions.node != null;

export const getClientType: () => "browser" | "server" = () => {
    if (isBrowser) {
        return 'browser';
    } else {
        return 'server';
    }
}

// export const createApiUrl = (path: string): string => { 
//     const route = '/api/v1';
//     return `${route}${path}`;
// }

export const createApiUrl = (path: string, queryParams?: Record<string, any>): string => {
    const route = '/api/v1';
    let url: any = path
    if (path.indexOf('rest/v17') === -1) {
        url = `${route}${path}`
    }
    // console.log("path",path ,"queryParams",queryParams)
    // Replace placeholders in the path with actual values
    if (queryParams) {
        Object.keys(queryParams).forEach(key => {
            url = url.replace(`:${key}`, queryParams[key]);
            //console.log("url1",url)
        });
    }

    // Append query parameters if provided
    if (queryParams) {
        const queryString = Object.keys(queryParams)
            .filter(key => !path.includes(`:${key}`)) // Exclude replaced placeholders from query params
            .map(key => {
                const encodedKey = encodeURIComponent(key);
                const encodedValue = encodeURIComponent(queryParams[key]);
                return `${encodedKey}=${encodedValue}`;
            }).join('&');

        if (queryString) {
            url += `?${queryString}`;
            // console.log("url2",url)
        }
    }
    console.log("Constructed URL:", url);
    return url;
}

export const getParsedLocalStorageItem = (key: string, defaultValue: any) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error parsing localStorage item for key "${key}":`, error);
      return defaultValue;
    }
}