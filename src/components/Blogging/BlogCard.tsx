import {Card, Typography} from "antd";
import {useTranslation} from "react-i18next";
import dayjs from "dayjs";
import DOMPurify from "dompurify";
import type {PageResponse} from "../../models";
import {useSession} from "../../session";


interface BlogCardProps {
    blog: PageResponse;
    expanded: boolean;
    onClick: () => void;
}

export function BlogCard({blog, expanded, onClick}: BlogCardProps) {
    const {t} = useTranslation();
    const {sessionLanguage} = useSession();

    const pageVersion = blog.page_versions?.find(pv => pv.language === sessionLanguage) || blog.page_versions?.[0];

    if (!pageVersion) {
        return null;
    }

    const formattedDate = blog.modified_at
        ? dayjs(blog.modified_at).format("YYYY-MM-DD HH:mm")
        : dayjs(blog.created_at).format("YYYY-MM-DD HH:mm");

    const dateLabel = blog.modified_at
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
            <Typography.Text type="secondary">{dateLabel} {formattedDate}</Typography.Text>

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
                <Typography.Text type="secondary" style={{display: "block", marginTop: 12}}>
                    {t("BlogCard.clickToExpand")}
                </Typography.Text>
            )}
        </Card>
    );
}
