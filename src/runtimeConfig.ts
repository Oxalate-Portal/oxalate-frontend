export interface RuntimeConfig {
    apiUrl: string;
    recaptchaSiteKey: string;
    pageTitle: string;
    copyrightFooter: string;
    poweredByOxalate: string;
    backgroundUrl?: string;
    faviconUrl: string;
    logoUrl?: string;
    appleTouchIconUrl: string;
}

type RuntimeConfigOverrides = Partial<RuntimeConfig>;

declare global {
    let __OXALATE_RUNTIME_CONFIG__: RuntimeConfigOverrides | undefined;
}

declare const __OXALATE_VITE_APP_API_URL__: string | undefined;
declare const __OXALATE_VITE_APP_RECAPTCHA_SITE_KEY__: string | undefined;
declare const __OXALATE_VITE_APP_PAGE_TITLE__: string | undefined;
declare const __OXALATE_VITE_APP_COPYRIGHT_FOOTER__: string | undefined;
declare const __OXALATE_VITE_APP_POWERED_BY_OXALATE__: string | undefined;
declare const __OXALATE_VITE_DEV__: boolean | undefined;

const buildValue = (value: string | undefined, fallback = "") => typeof value === "undefined" ? fallback : value;
const isViteDevelopment = typeof __OXALATE_VITE_DEV__ === "undefined" ? false : __OXALATE_VITE_DEV__;
const defaultBackgroundUrl = isViteDevelopment ? "/src/background.jpg" : "/site-files/background.jpg";
const defaultLogoUrl = isViteDevelopment ? "/src/portal_logo.svg" : "/site-files/navbar-logo.svg";

const defaultConfig: RuntimeConfig = {
    apiUrl: buildValue(typeof __OXALATE_VITE_APP_API_URL__ === "undefined" ? undefined : __OXALATE_VITE_APP_API_URL__),
    recaptchaSiteKey: buildValue(typeof __OXALATE_VITE_APP_RECAPTCHA_SITE_KEY__ === "undefined" ? undefined : __OXALATE_VITE_APP_RECAPTCHA_SITE_KEY__),
    pageTitle: buildValue(typeof __OXALATE_VITE_APP_PAGE_TITLE__ === "undefined" ? undefined : __OXALATE_VITE_APP_PAGE_TITLE__, "Oxalate Portal"),
    copyrightFooter: buildValue(typeof __OXALATE_VITE_APP_COPYRIGHT_FOOTER__ === "undefined" ? undefined : __OXALATE_VITE_APP_COPYRIGHT_FOOTER__),
    poweredByOxalate: buildValue(typeof __OXALATE_VITE_APP_POWERED_BY_OXALATE__ === "undefined" ? undefined : __OXALATE_VITE_APP_POWERED_BY_OXALATE__),
    backgroundUrl: defaultBackgroundUrl,
    faviconUrl: "/site-files/favicon.ico",
    logoUrl: defaultLogoUrl,
    appleTouchIconUrl: "/site-files/logo192.png"
};

export const runtimeConfig: RuntimeConfig = {
    ...defaultConfig,
    ...(globalThis.__OXALATE_RUNTIME_CONFIG__ ?? {})
};
