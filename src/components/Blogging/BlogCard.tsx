import {Card, Typography} from "antd";
import {useTranslation} from "react-i18next";
import dayjs from "dayjs";
import DOMPurify from "dompurify";
import type {PageResponse} from "../../models";
import {useSession} from "../../session";

const {Text} = Typography;

interface BlogCardProps {
    blog: PageResponse;
    expanded: boolean;
    onClick: () => void;
}

export function BlogCard({blog, expanded, onClick}: BlogCardProps) {
    const {t} = useTranslation();
    const {sessionLanguage} = useSession();

    const pageVersion = blog.pageVersions?.find(pv => pv.language === sessionLanguage) || blog.pageVersions?.[0];

    if (!pageVersion) {
        return null;
    }

    const formattedDate = blog.modifiedAt
            ? dayjs(blog.modifiedAt).format("YYYY-MM-DD HH:mm")
            : dayjs(blog.createdAt).format("YYYY-MM-DD HH:mm");

    const dateLabel = blog.modifiedAt
            ? t("BlogCard.updated")
            : t("BlogCard.published");

    return (
            <Card
                    hoverable
                    onClick={onClick}
                    style={{
                        marginBottom: 16,
                        cursor: "pointer",
                        width: "100%"
                    }}
            >
                <h4
                        style={{margin: "0 0 8px 0", fontSize: "20px", fontWeight: 600}}
                        dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(pageVersion.title)}}
                />
                <Text type="secondary">{dateLabel} {formattedDate}</Text>

                {pageVersion.ingress && (
                        <p
                                style={{marginTop: 12, fontWeight: "bold"}}
                                dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(pageVersion.ingress)}}
                        />
                )}

                {expanded && pageVersion.body && (
                        <div
                                style={{marginTop: 12}}
                                dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(pageVersion.body)}}
                        />
                )}

                {!expanded && (
                        <Text type="secondary" style={{display: "block", marginTop: 12}}>
                            {t("BlogCard.clickToExpand")}
                        </Text>
                )}
            </Card>
    );
}
