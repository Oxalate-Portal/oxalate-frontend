import { commentAPI } from "../../services";
import { useCallback, useEffect, useState } from "react";
import { CommentResponse } from "../../models/responses";
import { DisplayCommentThread } from "./DisplayCommentThread";
import { Spin } from "antd";
import { CommentEditor } from ".";

interface CommentCanvasProps {
    commentId: number;
    allowComment: boolean;
    depth?: number;
}

/**
 CommentCanvas takes a topic-typed commentId and displays the comment threads of that topic.
 If the topic is a direct child of one of the root comments, then it is not displayed, rather its children.
 */

export function CommentCanvas({commentId, allowComment, depth = 0}: CommentCanvasProps) {
    const [loading, setLoading] = useState<boolean>(true);
    const [comments, setComments] = useState<CommentResponse[]>([]);

    const ROOT_COMMENT_IDS = [1, 2, 3, 4];

    const refreshCommentList = useCallback(() => {
        setLoading(true);
        commentAPI.findAllForParentId(commentId)
                .then((response) => {
                    if (ROOT_COMMENT_IDS.includes(response.parentCommentId)) {
                        setComments(response.childComments);
                    } else {
                        setComments([response]);
                    }
                })
                .catch((err) => {
                    console.error("Failed to fetch comment:", err);
                })
                .finally(() => {
                    setLoading(false);
                });
    }, [commentId]);

    useEffect(() => {
        refreshCommentList();
    }, [refreshCommentList]);

    return (
            <div className="darkDiv">
            <Spin spinning={loading}>
                {comments.length > 0 && comments.map(comment => (
                        <DisplayCommentThread comment={comment} depth={depth} refreshCommentList={refreshCommentList} key={"comment-canvas-thread-" + commentId + "-" + comment.id}/>))}
                {allowComment && <CommentEditor parentCommentId={commentId} refreshCommentList={refreshCommentList} key={"comment-canvas-editor-" + commentId}/>}
            </Spin>
            </div>
    );
}
