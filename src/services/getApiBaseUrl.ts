type GlobalWithApiUrl = typeof globalThis & {
    __OXALATE_API_URL__?: string;
    process?: {
        env?: {
            VITE_APP_API_URL?: string;
        };
    };
};

declare const __OXALATE_VITE_APP_API_URL__: string | undefined;

interface ApiBaseUrlSources {
    globalUrl?: string;
    importMetaUrl?: string;
    processUrl?: string;
}

export function resolveApiBaseUrl({globalUrl, importMetaUrl, processUrl}: ApiBaseUrlSources): string {
    return (globalUrl || importMetaUrl || processUrl || "").trim().replace(/\/+$/, "");
}

export function getApiBaseUrl(): string {
    const fromGlobal = (globalThis as GlobalWithApiUrl).__OXALATE_API_URL__;
    const fromVite = typeof __OXALATE_VITE_APP_API_URL__ !== "undefined" ? __OXALATE_VITE_APP_API_URL__ : undefined;
    const fromProcess = (globalThis as GlobalWithApiUrl).process?.env?.VITE_APP_API_URL;
    return resolveApiBaseUrl({globalUrl: fromGlobal, importMetaUrl: fromVite, processUrl: fromProcess});
}

