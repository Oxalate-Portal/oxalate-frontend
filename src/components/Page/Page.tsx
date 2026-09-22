import {useParams} from "react-router-dom";
import {useEffect, useState} from "react";
import {useSession} from "../../session";
import {useTranslation} from "react-i18next";
import {Space, Spin} from "antd";
import dayjs from "dayjs";
import DOMPurify from "dompurify";
import type {PageProps, PageResponse} from "../../models";
import {pageAPI} from "../../services";

export function Page(pageProps: PageProps = {}) {
    const {pageId: propPageId, showTitle = true, showDate = true} = pageProps;
    const {paramId} = useParams();
    const pageId = propPageId || parseInt(paramId as string, 10);

    const [pageData, setPageData] = useState<PageResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const {sessionLanguage} = useSession();
    const {t} = useTranslation();

    useEffect(() => {
        pageAPI.findById(pageId, "language=" + sessionLanguage)
            .then((response) => {
                setPageData(response);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [pageId, sessionLanguage]);

    return (<div className={"darkDiv"}>
        <Spin spinning={loading}>
            {pageData && pageData.page_versions && pageData.page_versions.length > 0 && <div>
                <Space orientation={"vertical"} size={"large"}>
                    {showTitle && <h4 dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(pageData.page_versions[0].title)}}></h4>}

                    {showDate &&
                        <div>{pageData.modified_at == null ?
                            t("Page.fields.created") + dayjs(pageData.created_at).format("YYYY.MM.DD HH:mm") :
                            t("Page.fields.updated") + dayjs(pageData.modified_at).format("YYYY.MM.DD HH:mm")}</div>}

                    {pageData.page_versions[0].ingress.length > 0 &&
                        <p style={{fontWeight: "bold"}} dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(pageData.page_versions[0].ingress)}}/>}

                    <p dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(pageData.page_versions[0].body)}}/>

                </Space>
            </div>}
        </Spin>
    </div>);
}
