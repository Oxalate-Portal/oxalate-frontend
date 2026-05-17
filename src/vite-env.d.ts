/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />
/// <reference types="jest" />
/// <reference types="@types/jest" />

interface ImportMetaEnv {
    readonly VITE_APP_API_URL: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
