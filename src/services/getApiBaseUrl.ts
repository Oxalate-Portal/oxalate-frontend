type GlobalWithApiUrl = typeof globalThis & {
    __OXALATE_API_URL__?: string;
    process?: {
        env?: {
            VITE_APP_API_URL?: string;
        };
    };
};

export function getApiBaseUrl(): string {
    const fromGlobal = (globalThis as GlobalWithApiUrl).__OXALATE_API_URL__;
    const fromProcess = (globalThis as GlobalWithApiUrl).process?.env?.VITE_APP_API_URL;

    // Fallback to same-origin relative calls when no explicit base URL is provided.
    return fromGlobal || fromProcess || "";
}

