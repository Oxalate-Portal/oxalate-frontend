import {useState} from "react";
import type {CommentResponse} from "../../models";
import {Button, Listy, Typography} from "antd";
import {CommentCard} from "./CommentCard";
import {CommentEditor} from "./CommentEditor";
import {useTranslation} from "react-i18next";

interface DisplayCommentThreadProps {
    comment: CommentResponse;
    depth?: number;
    refreshCommentList: () => void;
}

const ROOT_COMMENT_IDS = [1, 2, 3, 4];

export function DisplayCommentThread({comment, depth = 0, refreshCommentList}: DisplayCommentThreadProps) {
    const {t} = useTranslation();
    const [expanded, setExpanded] = useState<boolean>(false);
    const parentIsRootComment = comment ? ROOT_COMMENT_IDS.includes(comment.parent_comment_id) : false;

    if (!comment) {
        return <Typography.Text type="secondary">{t("DisplayCommentThread.noComments")}</Typography.Text>;
    }

    const hasChildComments = comment.child_comments.length > 0;

    if (parentIsRootComment && !hasChildComments) {
        return (
            <div>
                <Button type={"primary"} onClick={() => setExpanded(!expanded)}>
                    {expanded ? "Hide" : "Be first to comment"}
                </Button>
                {expanded && <CommentEditor parentCommentId={comment.parent_comment_id} refreshCommentList={refreshCommentList}/>}
            </div>
        );
    }

    return (
        <div>
            {parentIsRootComment && hasChildComments ? (
                <>
                    <Listy
                        items={comment.child_comments}
                        rowKey={(child) => child.id}
                        itemRender={(child) => (
                            <div style={{width: "100%"}}>
                                <div style={{width: "100%"}}>
                                    <CommentCard comment={child} refreshCommentList={refreshCommentList}/>
                                    {child.child_comments.length > 0 && (
                                        <div style={{marginLeft: 20}}>
                                            <Button
                                                type="link"
                                                onClick={() => setExpanded(!expanded)}
                                                style={{marginBottom: 8}}
                                            >
                                                {expanded ? "Hide Replies" : `Show Replies (${child.child_comments.length})`}
                                            </Button>

                                            {expanded && child.child_comments.map((child) => (
                                                <DisplayCommentThread key={child.id} comment={child} depth={depth + 1}
                                                                      refreshCommentList={refreshCommentList}/>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    />
                    <Button type={"primary"} onClick={() => setExpanded(!expanded)}>{expanded ? "Hide" : "Add a new comment"}</Button>
                    {expanded && <CommentEditor parentCommentId={comment.parent_comment_id} refreshCommentList={refreshCommentList}/>}
                </>
            ) : (
                <Listy
                    items={[comment]}
                    rowKey={(item) => item.id}
                    itemRender={(item) => (
                        <div style={{width: "100%"}}>
                            <div style={{width: "100%"}}>
                                <CommentCard comment={item} refreshCommentList={refreshCommentList}/>

                                {hasChildComments && (
                                    <div style={{marginLeft: 20}}>
                                        <Button
                                            type="link"
                                            onClick={() => setExpanded(!expanded)}
                                            style={{marginBottom: 8}}
                                        >
                                            {expanded ? "Hide Replies" : `Show Replies (${item.child_comments.length})`}
                                        </Button>

                                        {expanded && item.child_comments.map((child) => (
                                            <DisplayCommentThread key={child.id} comment={child} depth={depth + 1}
                                                                  refreshCommentList={refreshCommentList}/>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                />
            )}
        </div>
    );
}
