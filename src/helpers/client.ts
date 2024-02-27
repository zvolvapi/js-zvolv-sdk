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

export const createApiUrl = (path: string): string => { 
    const route = '/api/v1';
    return `${route}${path}`;
}