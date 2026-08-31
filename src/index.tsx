import React from "react";
import {createRoot} from 'react-dom/client'
import "./index.css";
import App from "./App";
import {BrowserRouter} from "react-router-dom";
import {SessionProvider} from "./session";
import {I18nextProvider} from "react-i18next";
import i18n from "./i18n";
import {runtimeConfig} from "./runtimeConfig";

// Bridge Vite runtime env to service URL resolver used across API classes.
(globalThis as { __OXALATE_API_URL__?: string }).__OXALATE_API_URL__ = runtimeConfig.apiUrl.trim();
document.title = runtimeConfig.pageTitle;
document.querySelector<HTMLLinkElement>('link[rel="icon"]')?.setAttribute("href", runtimeConfig.faviconUrl);
document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]')?.setAttribute("href", runtimeConfig.appleTouchIconUrl);
if (runtimeConfig.backgroundUrl) {
    document.documentElement.style.setProperty("--oxalate-background-image", `url("${runtimeConfig.backgroundUrl}")`);
}

createRoot(document.getElementById('root')!).render(
        <React.StrictMode>
            <I18nextProvider i18n={i18n}>
                <SessionProvider>
                    <BrowserRouter>
                        <App/>
                    </BrowserRouter>
                </SessionProvider>
            </I18nextProvider>
        </React.StrictMode>
);
