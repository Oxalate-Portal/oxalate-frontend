import {Avatar, Button, Card, message, Modal, Space, Typography} from "antd";
import {UserOutlined} from "@ant-design/icons";
import dayjs from "dayjs";
import {useState} from "react";
import {type CommentResponse, type ReportRequest, UpdateStatusEnum} from "../../models";
import {commentAPI} from "../../services";
import {CommentEditor} from "./CommentEditor";
import {useTranslation} from "react-i18next";

interface CommentCardProps {
    comment: CommentResponse;
    displayOnly?: boolean;
    refreshCommentList: () => void;
}

export function CommentCard({comment, displayOnly = false, refreshCommentList}: CommentCardProps) {
    const [replyVisible, setReplyVisible] = useState(false);
    const [reportVisible, setReportVisible] = useState(false);
    const [reportReason, setReportReason] = useState("");
    const [messageApi, contextHolder] = message.useMessage();
    const {t} = useTranslation();

    async function handleReport() {
        const reportData: ReportRequest = {
            commentId: comment.id,
            reportReason,
        };
        commentAPI.report(reportData)
                .then((response) => {
                    if (response.status !== UpdateStatusEnum.OK) {
                        messageApi.error(t("CommentCard.messages.report-fail"));
                    } else {
                        messageApi.success(t("CommentCard.messages.report-success"));
                    }
                })
                .catch((error) => {
                    console.log(error);
                })
                .finally(() => {
                    setReportVisible(false);
                    setReportReason("");
                });
    }

    function cancelReport() {
        commentAPI.cancelReport(comment.id)
                .then((response) => {
                    if (response.status !== UpdateStatusEnum.OK) {
                        messageApi.error(t("CommentCard.messages.report-cancel-fail"));
                    } else {
                        messageApi.success(t("CommentCard.messages.report-cancel-success"));
                    }
                })
                .catch((error) => {
                    console.error("Failed to cancel report:", error);
                })
                .finally(() => {
                    setReportVisible(true);
                    setReportReason("");
                });
    }

    return (
            <Card style={{marginBottom: 16, width: "100%"}}>
                {contextHolder}
                <Space direction="vertical" size="large" style={{width: "100%"}}>
                    <div style={{display: "flex", alignItems: "center", marginBottom: 8}}>
                        <Avatar icon={<UserOutlined/>} size={40} style={{marginRight: 12}}/>
                        <div>
                            <Typography.Text strong>{comment.username} (#{comment.id})</Typography.Text>
                            <br/>
                            <Typography.Text type="secondary">
                                {dayjs(comment.createdAt).format("YYYY-MM-DD HH:mm")} {comment.childCount} {comment.childCount < 2 ? t("CommentCard.singular-reply") : t("CommentCard.multiple-replies")}
                            </Typography.Text>
                        </div>
                    </div>
                    <Typography.Title level={5}>{comment.title}</Typography.Title>
                    <Typography.Text>{comment.body}</Typography.Text>
                    <div style={{display: "flex", justifyContent: "space-between", width: "100%"}}>
                        {!displayOnly &&
                                <Button onClick={() => setReplyVisible(!replyVisible)}>{replyVisible ? t("common.button.cancel") : t("common.button.respond")}</Button>}
                        {!displayOnly && !comment.userHasReported &&
                                <Button danger onClick={() => setReportVisible(true)}>{t("CommentCard.button.report-comment")}</Button>}
                        {!displayOnly && comment.userHasReported &&
                                <Button danger onClick={() => cancelReport()}>{t("CommentCard.button.cancel-report")}</Button>}
                    </div>
                    {replyVisible && <CommentEditor parentCommentId={comment.id} refreshCommentList={() => {
                        setReplyVisible(false);
                        refreshCommentList();
                    }}/>}
                </Space>
                <Modal
                        title={t("CommentCard.button.report-comment")}
                        open={reportVisible}
                        onOk={handleReport}
                        onCancel={() => setReportVisible(false)}
                        okButtonProps={{disabled: !reportReason.trim()}}
                        okText={t("common.button.send")}
                        cancelText={t("common.button.cancel")}
                    >
                    <Typography.Paragraph>{t("CommentCard.modal.description")}</Typography.Paragraph>
                    <textarea
                            rows={4}
                            placeholder={t("CommentCard.modal.placeholder")}
                            value={reportReason}
                            onChange={(e) => setReportReason(e.target.value)}
                            style={{width: "100%"}}
                    />
                </Modal>
            </Card>
    );
}
