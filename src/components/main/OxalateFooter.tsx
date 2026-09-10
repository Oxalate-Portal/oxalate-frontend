import BuildInfoData from "../../buildInfo.json";
import {Layout} from "antd";
import DOMPurify from "dompurify";
import type {BuildInfo} from "../../models";
import {runtimeConfig} from "../../runtimeConfig";

/**
 * OWASP A05:2025 - Injection (CWE-79, DOM based XSS).
 *
 * The footer intentionally renders HTML so that a deployment can supply a link in
 * `copyrightFooter` / `poweredByOxalate`. Those values come from `runtime-config.js`, which is
 * writable by whoever deploys the site, so a compromised or careless deployment config would
 * otherwise turn straight into script execution on every page. Sanitizing keeps the intended
 * formatting while removing scripts and event handlers.
 */
function OxalateFooter() {
    const buildInfo: BuildInfo = BuildInfoData;

    const footerHtml = DOMPurify.sanitize(
            runtimeConfig.copyrightFooter + "<br/>"
            + "v" + buildInfo.version + " " + " built: " + buildInfo.buildTime + "<br/>"
            + runtimeConfig.poweredByOxalate,
            {ADD_ATTR: ["target", "rel"]}
    );

    return (
            <Layout.Footer style={{textAlign: "center", background: "#101010", padding: "20px"}}
                           dangerouslySetInnerHTML={{__html: footerHtml}}/>
    );
}

export { OxalateFooter };