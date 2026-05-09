import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

export default defineConfig({
    // depending on your application, base can also be "/"
    base: "/",
    define: {
        __OXALATE_VITE_APP_API_URL__: JSON.stringify(process.env.VITE_APP_API_URL || "")
    },
    plugins: [react(), svgr()],
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
        outDir: "build",
    }
});