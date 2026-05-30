import BuildInfoData from "../../buildInfo.json";
import {Layout} from "antd";
import type {BuildInfo} from "../../models";

function OxalateFooter() {
    const buildInfo: BuildInfo = BuildInfoData;

    return (
            <Layout.Footer style={{textAlign: "center", background: "#101010", padding: "20px"}}
                    dangerouslySetInnerHTML={{
                        __html: import.meta.env.VITE_APP_OXALATE_COPYRIGHT_FOOTER + "<br/>"
                                + "v" + buildInfo.version + " " + " built: " + buildInfo.buildTime + "<br/>"
                                + import.meta.env.VITE_APP_POWERED_BY_OXALATE
                    }}/>
    );
}

export { OxalateFooter };