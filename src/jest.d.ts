/// <reference types="jest" />
/// <reference types="node" />

interface ImportMetaEnv {
    readonly VITE_APP_API_URL: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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



