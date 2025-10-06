import {useEffect, useState} from "react";
import {commentAPI} from "../../services";
import type {CommentModerationResponse} from "../../models";
import {Collapse, type CollapseProps, message, Space, Spin} from "antd";
import {CommentCard, CommentModerationActions, ReportCard} from "../Commenting";
import {useTranslation} from "react-i18next";

export function CommentModeration() {
    const [loading, setLoading] = useState<boolean>(true);
    const [pendingCommentReports, setCommentReports] = useState<CommentModerationResponse[]>([]);
    const [messageApi, contextHolder] = message.useMessage();
    const {t} = useTranslation();

    function fetchPendingReports() {
        setLoading(true);

        commentAPI.getPendingReports()
                .then(response => {
                    setCommentReports(response);
                    messageApi.success(t("CommentModeration.messages.success"));
                })
                .catch(error => {
                    console.error("Failed to fetch pending reports:", error);
                    messageApi.error(t("CommentModeration.messages.fail"));
                })
                .finally(() => {
                    setLoading(false);
                });
    }

    useEffect(() => {
        fetchPendingReports();
    }, []);

    return (
            <Spin spinning={loading}>
                {contextHolder}
                <div className="darkDiv">
                    <Space direction="vertical"
                           style={{width: "100%"}}
                           size={"middle"}>
                        <h4>{t("CommentModeration.title")}</h4>
                        {pendingCommentReports.length > 0 ? (
                                pendingCommentReports.map(moderatedComment => {
                                    const itemLabel = moderatedComment.title.length > 0 ? moderatedComment.title : moderatedComment.body.substring(0, 40) + "...";
                                    const items: CollapseProps["items"] = [
                                        {
                                            key: "comment-" + moderatedComment.id,
                                            label: itemLabel,
                                            children: <CommentCard comment={moderatedComment} refreshCommentList={() => fetchPendingReports()}
                                                                   displayOnly={true}/>,
                                        },
                                        {
                                            key: "reports-" + moderatedComment.id,
                                            label: t("CommentModeration.collapse.reports.label"),
                                            children: moderatedComment.reports.map(report => (
                                                    <ReportCard key={report.id} report={report} refreshModerationList={() => fetchPendingReports()}/>
                                            )),
                                        },
                                        {
                                            key: "actions-" + moderatedComment.id,
                                            label: t("CommentModeration.collapse.actions.label"),
                                            children: <CommentModerationActions commentId={moderatedComment.id}
                                                                                refreshModerationList={() => fetchPendingReports()}
                                                                                childCount={moderatedComment.childCount}/>,
                                        },
                                    ];

                                    return <Collapse key={moderatedComment.id} items={items} defaultActiveKey={["actions-" + moderatedComment.id]}/>;
                                })
                        ) : (
                                <p>No pending reports.</p>
                        )}
                    </Space>
                </div>
            </Spin>
    );
}