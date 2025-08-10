import {Button, message, Spin} from "antd";
import {commentAPI} from "../../services";
import {useState} from "react";
import {useTranslation} from "react-i18next";

interface CommentModerationActionsProps {
    commentId: number;
    refreshModerationList: () => void;
    childCount: number;
}

export function CommentModerationActions({commentId, refreshModerationList, childCount}: CommentModerationActionsProps) {
    const [loading, setLoading] = useState<boolean>(false);
    const [messageApi, contextHolder] = message.useMessage();
    const {t} = useTranslation();

    async function handleRejectComment() {
        if (childCount > 0
        && !window.confirm(t("CommentModerationActions.messages.reject-comment-confirm"))) {
            return;
        }

        setLoading(true);
        commentAPI.rejectComment(commentId)
                .then(() => {
                    messageApi.success(t("CommentModerationActions.messages.reject-comment-success"));
                })
                .catch((err) => {
                    console.error(err);
                    messageApi.error(t("CommentModerationActions.messages.reject-comment-fail"));
                })
                .finally(() => {
                    setLoading(false);
                });
        refreshModerationList();
    }

    async function handleDismissReports() {
        setLoading(true);
        commentAPI.rejectReports(commentId)
                .then(() => {
                    messageApi.success(t("CommentModerationActions.messages.dismiss-comment-success"));
                })
                .catch((err) => {
                    console.error(err);
                    messageApi.error(t("CommentModerationActions.messages.dismiss-comment-fail"));
                })
                .finally(() => {
                    setLoading(false);
                });

        refreshModerationList();
    }

    return (
            <Spin spinning={loading}>
                {contextHolder}
                <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                    <Button type="primary" loading={loading} onClick={handleRejectComment}>
                        {t("CommentModerationActions.button.reject-comment")}
                    </Button>
                    <Button danger loading={loading} onClick={handleDismissReports}>
                        {t("CommentModerationActions.button.dismiss-reports")}
                    </Button>
                </div>
            </Spin>
    );
}