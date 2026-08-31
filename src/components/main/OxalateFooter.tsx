import BuildInfoData from "../../buildInfo.json";
import {Layout} from "antd";
import type {BuildInfo} from "../../models";
import {runtimeConfig} from "../../runtimeConfig";

function OxalateFooter() {
    const buildInfo: BuildInfo = BuildInfoData;

    return (
            <Layout.Footer style={{textAlign: "center", background: "#101010", padding: "20px"}}
                    dangerouslySetInnerHTML={{
                        __html: runtimeConfig.copyrightFooter + "<br/>"
                                + "v" + buildInfo.version + " " + " built: " + buildInfo.buildTime + "<br/>"
                                + runtimeConfig.poweredByOxalate
                    }}/>
    );
}

export { OxalateFooter };