import {PageFiles} from "./PageFiles";
import {DocumentFiles} from "./DocumentFiles";
import {DiveFiles} from "./DiveFiles";
import {CertificateFiles} from "./CertificateFiles";
import {Tabs, TabsProps, Typography} from "antd";
import {AvatarFiles} from "./AvatarFiles";
import {useTranslation} from "react-i18next";

export function AdminUploads() {
    const {TabPane} = Tabs;
    const {t} = useTranslation();

    const items: TabsProps["items"] = [
        {
            key: "1",
            label: t("AdminUploads.overview.tab-title"),
            children: <>
                <Typography.Title level={1}>{t("AdminUploads.overview.overview-title")}</Typography.Title>

                <Typography.Paragraph>{t("AdminUploads.overview.overview-content-1")}</Typography.Paragraph>
                <Typography.Paragraph>{t("AdminUploads.overview.overview-content-2")}</Typography.Paragraph>

                <Typography.Title level={2}>{t("AdminUploads.overview.type-title")}</Typography.Title>

                <Typography.Paragraph>{t("AdminUploads.overview.type-content")}</Typography.Paragraph>

                <Typography.Title level={3}>{t("AdminUploads.overview.avatar-title")}</Typography.Title>

                <Typography.Paragraph>{t("AdminUploads.overview.avatar-content")}</Typography.Paragraph>

                <Typography.Title level={3}>{t("AdminUploads.overview.certificate-title")}</Typography.Title>

                <Typography.Paragraph>{t("AdminUploads.overview.certificate-content")}</Typography.Paragraph>

                <Typography.Title level={3}>{t("AdminUploads.overview.dive-file-title")}</Typography.Title>

                <Typography.Paragraph>{t("AdminUploads.overview.dive-file-content")}</Typography.Paragraph>

                <Typography.Title level={3}>{t("AdminUploads.overview.document-title")}</Typography.Title>

                <Typography.Paragraph>{t("AdminUploads.overview.document-content")}</Typography.Paragraph>

                <Typography.Title level={3}>{t("AdminUploads.overview.page-file-title")}</Typography.Title>

                <Typography.Paragraph>{t("AdminUploads.overview.page-file-content")}</Typography.Paragraph>
            </>
        },
        {
            key: "2",
            label: t("AdminUploads.avatar.tab-title"),
            children: <AvatarFiles />
        },
        {
            key: "3",
            label: t("AdminUploads.certificate.tab-title"),
            children: <CertificateFiles />
        },
        {
            key: "4",
            label: t("AdminUploads.dive-file.tab-title"),
            children: <DiveFiles />
        },
        {
            key: "5",
            label: t("AdminUploads.document.tab-title"),
            children: <DocumentFiles />
        },
        {
            key: "6",
            label: t("AdminUploads.page-file.tab-title"),
            children: <PageFiles />
        }
    ];

    return (
            <div className={"darkDiv"}>
                <Tabs defaultActiveKey={"1"} items={items} />
            </div>
    );
}
