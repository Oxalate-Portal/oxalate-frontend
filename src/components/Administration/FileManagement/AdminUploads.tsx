import { PageFiles } from "./PageFiles";
import { DocumentFiles } from "./DocumentFiles";
import { DiveFiles } from "./DiveFiles";
import { CertificateFiles } from "./CertificateFiles";
import { Tabs, Typography } from "antd";
import { AvatarFiles } from "./AvatarFiles";
import { useTranslation } from "react-i18next";

export function AdminUploads() {
    const {TabPane} = Tabs;
    const {t} = useTranslation();

    return (
            <div className={"darkDiv"}>
                <Tabs defaultActiveKey={"1"}>
                    <TabPane tab={t("AdminUploads.overview.tab-title")} key="1">
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
                    </TabPane>
                    <TabPane tab={t("AdminUploads.avatar.tab-title")} key="2">
                        <AvatarFiles/>
                    </TabPane>
                    <TabPane tab={t("AdminUploads.certificate.tab-title")} key="3">
                        <CertificateFiles/>
                    </TabPane>
                    <TabPane tab={t("AdminUploads.dive-file.tab-title")} key="4">
                        <DiveFiles/>
                    </TabPane>
                    <TabPane tab={t("AdminUploads.document.tab-title")} key="5">
                        <DocumentFiles/>
                    </TabPane>
                    <TabPane tab={t("AdminUploads.page-file.tab-title")} key="6">
                        <PageFiles/>
                    </TabPane>
                </Tabs>
            </div>
    );
}
