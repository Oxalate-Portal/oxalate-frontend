import { PageStatusEnum } from "../../models";
import { Tag } from "antd";
import { useTranslation } from "react-i18next";

interface PageStatusTagProps {
    pageStatus: PageStatusEnum,
    recordId: number
}

export function PageStatusTag({pageStatus, recordId}: PageStatusTagProps) {
    const {t} = useTranslation();

    let color = "";
    let statusLabel = "";

    switch (pageStatus) {
        case PageStatusEnum.DRAFTED:
            color = "blue";
            statusLabel = t("common.pages.status.drafted");
            break;
        case PageStatusEnum.PUBLISHED:
            color = "green";
            statusLabel = t("common.pages.status.published");
            break;
        case PageStatusEnum.DELETED:
            color = "red";
            statusLabel = t("common.pages.status.deleted");
            break;
    }

    return (
            <Tag color={color} key={recordId + "-status" + pageStatus}>
                {statusLabel}
            </Tag>
    );
}