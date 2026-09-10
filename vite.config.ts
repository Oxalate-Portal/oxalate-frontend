import {defineConfig, type Plugin} from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

/**
 * OWASP A02:2025 - Security Misconfiguration.
 *
 * The application had no Content-Security-Policy at all, so a single successful HTML injection anywhere
 * (the CKEditor content, the runtime configured footer) would have had unrestricted script execution.
 *
 * The policy is injected only into production builds: the Vite dev server injects inline scripts for hot
 * module replacement, which a policy this strict would block.
 *
 * A meta tag cannot express `frame-ancestors` or `report-uri`; prefer setting the same policy as a response
 * header in the serving layer (nginx, CDN) where it can also carry those directives.
 */
function contentSecurityPolicy(): Plugin {
    const policy = [
        "default-src 'self'",
        // Google reCAPTCHA v3 loads its own script and worker
        "script-src 'self' https://www.google.com https://www.gstatic.com",
        // Ant Design injects component styles at runtime
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob: https:",
        "font-src 'self' data:",
        // The API base URL is deployment configurable, so the scheme rather than the host is constrained
        "connect-src 'self' https: http:",
        "frame-src https://www.google.com",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'"
    ].join("; ");

    return {
        name: "oxalate-content-security-policy",
        apply: "build",
        transformIndexHtml(html: string) {
            return html.replace(
                "<head>",
                `<head>\n    <meta http-equiv="Content-Security-Policy" content="${policy}"/>`
            );
        }
    };
}

export default defineConfig(({command}) => ({
    // depending on your application, base can also be "/"
    base: "/",
    define: {
        __OXALATE_VITE_APP_API_URL__: JSON.stringify(process.env.VITE_APP_API_URL || ""),
        __OXALATE_VITE_APP_RECAPTCHA_SITE_KEY__: JSON.stringify(process.env.VITE_APP_RECAPTCHA_SITE_KEY || ""),
        __OXALATE_VITE_APP_PAGE_TITLE__: JSON.stringify(process.env.VITE_APP_OXALATE_PAGE_TITLE || ""),
        __OXALATE_VITE_APP_COPYRIGHT_FOOTER__: JSON.stringify(process.env.VITE_APP_OXALATE_COPYRIGHT_FOOTER || ""),
        __OXALATE_VITE_APP_POWERED_BY_OXALATE__: JSON.stringify(process.env.VITE_APP_POWERED_BY_OXALATE || ""),
        __OXALATE_VITE_DEV__: command === "serve"
    },
    plugins: [react(), svgr(), contentSecurityPolicy()],
    resolve: {
        tsconfigPaths: true,
    },
    server: {
        // this ensures that the browser opens upon server start
        open: true,
        // this sets a default port to 3000
        port: 3000,
    },
    build: {
        outDir: "dist",
    }
}));