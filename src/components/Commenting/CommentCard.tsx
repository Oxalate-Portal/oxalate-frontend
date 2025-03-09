import { Avatar, Button, Card, message, Modal, Space, Typography } from "antd";
import { UserOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useState } from "react";
import { CommentResponse } from "../../models/responses";
import { commentAPI } from "../../services";
import { ReportRequest } from "../../models/requests";
import { CommentEditor } from "./CommentEditor";

interface CommentCardProps {
    comment: CommentResponse;
    onReplySubmitted: () => void;
}

export function CommentCard({comment, onReplySubmitted}: CommentCardProps) {
    const [replyVisible, setReplyVisible] = useState(false);
    const [reportVisible, setReportVisible] = useState(false);
    const [reportReason, setReportReason] = useState("");
    const [messageApi, contextHolder] = message.useMessage();

    async function handleReport() {
        const reportData: ReportRequest = {
            commentId: comment.id,
            reportReason,
        };
        commentAPI.report(reportData)
                .then((response) => {
                    if (response.errorCode !== 200) {
                        messageApi.error("Failed to report comment.");
                    } else {
                        messageApi.success("Comment reported successfully.");
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
                    if (response.errorCode !== 200) {
                        messageApi.error("Failed to cancel report.");
                    } else {
                        messageApi.success("Report cancelled successfully.");
                    }
                })
                .catch((error) => {
                    console.error("Failed to cancel report:", error);
                })
                .finally(() => {
                    setReportVisible(true);
                    setReportReason("");
                })
    }

    return (
            <Card style={{marginBottom: 16, width: "100%"}}>
                <Space direction="vertical" size="large" style={{width: "100%"}}>
                    <div style={{display: "flex", alignItems: "center", marginBottom: 8}}>
                        <Avatar icon={<UserOutlined/>} size={40} style={{marginRight: 12}}/>
                        <div>
                            <Typography.Text strong>{comment.username} (#{comment.id})</Typography.Text>
                            <br/>
                            <Typography.Text type="secondary">
                                Commented: {dayjs(comment.createdAt).format("YYYY-MM-DD HH:mm")}
                            </Typography.Text>
                        </div>
                    </div>
                    <Typography.Title level={5}>{comment.title}</Typography.Title>
                    <Typography.Text>{comment.body}</Typography.Text>
                    <div style={{display: "flex", justifyContent: "space-between", width: "100%"}}>
                        <Button onClick={() => setReplyVisible(!replyVisible)}>{replyVisible ? "Cancel" : "Respond"}</Button>
                        {!comment.userHasReported && <Button danger onClick={() => setReportVisible(true)}>Report inappropriate comment</Button>}
                        {comment.userHasReported && <Button danger onClick={() => cancelReport()}>Cancel report</Button>}
                    </div>
                    {replyVisible && <CommentEditor parentCommentId={comment.id} onCommentSubmitted={() => {
                        setReplyVisible(false);
                        onReplySubmitted();
                    }}/>}
                </Space>
                <Modal
                        title="Report Inappropriate Comment"
                        open={reportVisible}
                        onOk={handleReport}
                        onCancel={() => setReportVisible(false)}
                        okButtonProps={{disabled: !reportReason.trim()}}
                >
                    <Typography.Paragraph>Describe the issue:</Typography.Paragraph>
                    <textarea
                            rows={4}
                            placeholder="Provide details here..."
                            value={reportReason}
                            onChange={(e) => setReportReason(e.target.value)}
                            style={{width: "100%"}}
                    />
                </Modal>
            </Card>
    );
}
