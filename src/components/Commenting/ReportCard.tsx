import { Button, Card, message, Spin } from "antd";
import { CommentReportResponse } from "../../models/responses";
import { commentAPI } from "../../services";
import { useState } from "react";
import { reportStatusEnum2Tag } from "../../helpers";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";

interface ReportCardProps {
    report: CommentReportResponse;
    refreshModerationList: () => void;
}

export function ReportCard({report, refreshModerationList}: ReportCardProps) {
    const [loading, setLoading] = useState<boolean>(false);
    const [messageApi, contextHolder] = message.useMessage();
    const {t} = useTranslation();

    async function handleAcceptReport() {
        setLoading(true);
        commentAPI.acceptReport(report.id)
                .then(() => {
                    messageApi.success(t("ReportCard.messages.accept-success"));
                })
                .catch((err) => {
                    console.error(err);
                    messageApi.error(t("ReportCard.messages.accept-fail"));
                })
                .finally(() => {
                    setLoading(false);
                });
        refreshModerationList();
    }

    async function handleDismissReport() {
        setLoading(true);
        await commentAPI.dismissReport(report.id)
                .then(() => {
                    messageApi.success(t("ReportCard.messages.dismiss-success"));
                })
                .catch((err) => {
                    console.error(err);
                    messageApi.error(t("ReportCard.messages.dismiss-fail"));
                })
                .finally(() => {
                    setLoading(false);
                });

        refreshModerationList();
    }

    return (
            <Spin spinning={loading}>
                {contextHolder}
                <Card size="small" style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                            <p><strong>{t("ReportCard.field.reporter")}:</strong> {report.reporter} (ID: {report.reporterId})</p>
                            <p><strong>{t("ReportCard.field.reason")}:</strong> {report.reason}</p>
                            <p><strong>{t("ReportCard.field.created-at")}:</strong> {dayjs(report.createdAt).format("YYYY.MM.DD HH:mm")}</p>
                            <p><strong>{t("ReportCard.field.status")}:</strong> {reportStatusEnum2Tag(report.status, t, report.id)}</p>
                        </div>
                        <div style={{display: "flex", flexDirection: "column", gap: 8, alignSelf: "flex-start"}}>
                            <Button type="primary" onClick={handleAcceptReport}>{t("ReportCard.button.accept")}</Button>
                            <Button danger onClick={handleDismissReport}>{t("ReportCard.button.dismiss")}</Button>
                        </div>
                    </div>
                </Card>
            </Spin>
    );
}
