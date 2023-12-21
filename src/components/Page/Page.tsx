import PageProps from "../../models/props/PageProps";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import PageResponse from "../../models/responses/PageResponse";
import { useSession } from "../../session";
import { useTranslation } from "react-i18next";
import pageAPI from "../../services/PageAPI";
import { Space, Spin } from "antd";
import dayjs from "dayjs";
import DOMPurify from "dompurify";

function Page(pageProps: PageProps = {}) {
    const { pageId: propPageId, showTitle = true, showDate = true } = pageProps;
    const {pageId: paramPageId} = useParams();
    const pageId = propPageId || parseInt(paramPageId as string, 10);

    const [pageData, setPageData] = useState<PageResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const {sessionLanguage} = useSession();
    const {t} = useTranslation();

    useEffect(() => {
        setLoading(true);
        pageAPI.findById(pageId, "language=" + sessionLanguage).then((response) => {
            setPageData(response);
        });
        setLoading(false);
    }, [pageId, sessionLanguage]);

    return (<div className={"darkDiv"}>
        <Spin spinning={loading}>
            {pageData && pageData.pageVersions && pageData.pageVersions.length > 0 && <div>
                <Space direction={"vertical"} size={"large"}>
                    {showTitle && <h4 dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(pageData.pageVersions[0].title)}}></h4>}

                    {showDate &&
                            <div>{pageData.modifiedAt == null ?
                                    t("Page.fields.created") + dayjs(pageData.createdAt).format("YYYY.MM.DD HH:mm") :
                                    t("Page.fields.updated") + dayjs(pageData.modifiedAt).format("YYYY.MM.DD HH:mm")}</div>}

                    {pageData.pageVersions[0].ingress.length > 0 &&
                            <p style={{fontWeight: "bold"}} dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(pageData.pageVersions[0].ingress)}}/>}

                    <p dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(pageData.pageVersions[0].body)}}/>

                </Space>
            </div>}
        </Spin>
    </div>);
}

export default Page;