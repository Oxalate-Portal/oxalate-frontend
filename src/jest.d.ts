/// <reference types="jest" />
/// <reference types="node" />

interface ImportMetaEnv {
    readonly VITE_APP_API_URL: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            VITE_APP_API_URL: string;
        }
    }
}

export {};



