import React, { useState } from "react";
import { CommentResponse } from "../../models/responses";
import { Button, List, Typography } from "antd";
import { CommentCard } from "./CommentCard";
import { CommentEditor } from "./CommentEditor";

interface DisplayCommentThreadProps {
    comment: CommentResponse;
    depth?: number;
    refreshCommentList: () => void;
}

const ROOT_COMMENT_IDS = [1, 2, 3, 4];

export function DisplayCommentThread({comment, depth = 0, refreshCommentList}: DisplayCommentThreadProps) {
    const [expanded, setExpanded] = useState<boolean>(false);
    const [parentIsRootComment, setParentIsRootComment] = useState<boolean>(false);

    if (!comment) {
        return <Typography.Text type="secondary">No comments available.</Typography.Text>;
    }

    if (ROOT_COMMENT_IDS.includes(comment.parentCommentId)) {
        setParentIsRootComment(true);
    }

    const hasChildComments = comment.childComments.length > 0;

    if (parentIsRootComment && !hasChildComments) {
        return (
                <div>
                    <Button type={"primary"} onClick={() => setExpanded(!expanded)}>
                        {expanded ? "Hide" : "Be first to comment"}
                    </Button>
                    {expanded && <CommentEditor parentCommentId={comment.parentCommentId} refreshCommentList={refreshCommentList}/>}
                </div>
        );
    }

    return (
            <div>
                {parentIsRootComment && hasChildComments ? (
                        <>
                            <List
                                    dataSource={comment.childComments}
                                    renderItem={(child) => (
                                            <List.Item key={child.id} style={{width: "100%"}}>
                                                <div style={{width: "100%"}}>
                                                    <CommentCard comment={child} refreshCommentList={refreshCommentList}/>
                                                    {child.childComments.length > 0 && (
                                                            <div style={{marginLeft: 20}}>
                                                                <Button
                                                                        type="link"
                                                                        onClick={() => setExpanded(!expanded)}
                                                                        style={{marginBottom: 8}}
                                                                >
                                                                    {expanded ? "Hide Replies" : `Show Replies (${child.childComments.length})`}
                                                                </Button>

                                                                {expanded && child.childComments.map((child) => (
                                                                        <DisplayCommentThread key={child.id} comment={child} depth={depth + 1}
                                                                                              refreshCommentList={refreshCommentList}/>
                                                                ))}
                                                            </div>
                                                    )}
                                                </div>
                                            </List.Item>
                                    )}
                            />
                            <Button type={"primary"} onClick={() => setExpanded(!expanded)}>{expanded ? "Hide" : "Add a new comment"}</Button>
                            {expanded && <CommentEditor parentCommentId={comment.parentCommentId} refreshCommentList={refreshCommentList}/>}
                        </>
                ) : (
                        <List
                                dataSource={[comment]}
                                renderItem={(item) => (
                                        <List.Item key={item.id} style={{width: "100%"}}>
                                            <div style={{width: "100%"}}>
                                                <CommentCard comment={item} refreshCommentList={refreshCommentList}/>

                                                {hasChildComments && (
                                                        <div style={{marginLeft: 20}}>
                                                            <Button
                                                                    type="link"
                                                                    onClick={() => setExpanded(!expanded)}
                                                                    style={{marginBottom: 8}}
                                                            >
                                                                {expanded ? "Hide Replies" : `Show Replies (${item.childComments.length})`}
                                                            </Button>

                                                            {expanded && item.childComments.map((child) => (
                                                                    <DisplayCommentThread key={child.id} comment={child} depth={depth + 1}
                                                                                          refreshCommentList={refreshCommentList}/>
                                                            ))}
                                                        </div>
                                                )}
                                            </div>
                                        </List.Item>
                                )}
                        />
                )}
            </div>
    );
}
