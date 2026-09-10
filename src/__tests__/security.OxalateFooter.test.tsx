import {render, screen} from "@testing-library/react";
import {OxalateFooter} from "../components/main/OxalateFooter";
import {runtimeConfig} from "../runtimeConfig";

jest.mock("../buildInfo.json", () => ({version: "1.2.3", buildTime: "2026-01-01"}), {virtual: true});

/**
 * OWASP A05:2025 - Injection (CWE-79).
 *
 * The footer is the only place in the application that renders HTML through
 * `dangerouslySetInnerHTML` without sanitising it first. The markup comes from `runtime-config.js`, a
 * deployment-controlled file, so an injected `<script>` or event handler there would execute on every page of
 * the portal. These tests keep the sanitisation in place while preserving the intended link markup.
 */
describe("OWASP A05: the footer sanitises deployment supplied HTML", () => {
    const originalCopyright = runtimeConfig.copyrightFooter;
    const originalPoweredBy = runtimeConfig.poweredByOxalate;

    afterEach(() => {
        runtimeConfig.copyrightFooter = originalCopyright;
        runtimeConfig.poweredByOxalate = originalPoweredBy;
    });

    it("strips script elements", () => {
        runtimeConfig.copyrightFooter = "Club <script>window.__pwned = true;</script>";
        runtimeConfig.poweredByOxalate = "";

        const {container} = render(<OxalateFooter/>);

        expect(container.querySelector("script")).toBeNull();
        expect(container.innerHTML).not.toContain("__pwned");
    });

    it("strips inline event handlers", () => {
        runtimeConfig.copyrightFooter = "<img src=\"x\" onerror=\"window.__pwned = true\"/>";
        runtimeConfig.poweredByOxalate = "";

        const {container} = render(<OxalateFooter/>);

        expect(container.innerHTML).not.toContain("onerror");
    });

    it("strips javascript: URLs", () => {
        runtimeConfig.copyrightFooter = "<a href=\"javascript:window.__pwned=true\">click</a>";
        runtimeConfig.poweredByOxalate = "";

        const {container} = render(<OxalateFooter/>);

        expect(container.innerHTML).not.toContain("javascript:");
    });

    it("keeps the legitimate link markup a deployment configures", () => {
        runtimeConfig.copyrightFooter = "Oxalate Portal project";
        runtimeConfig.poweredByOxalate = "Powered by <a href=\"https://oxalate.io/\">Oxalate Portal</a>";

        render(<OxalateFooter/>);

        const link = screen.getByRole("link", {name: "Oxalate Portal"});
        expect(link).toHaveAttribute("href", "https://oxalate.io/");
    });

    it("still renders the build information", () => {
        runtimeConfig.copyrightFooter = "";
        runtimeConfig.poweredByOxalate = "";

        const {container} = render(<OxalateFooter/>);

        expect(container.textContent).toContain("v1.2.3");
    });
});
