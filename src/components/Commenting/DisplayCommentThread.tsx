import React, { useEffect, useState } from "react";
import { CommentResponse } from "../../models/responses";
import { List, Spin, Typography } from "antd";
import { CommentCard } from "./CommentCard";
import { commentAPI } from "../../services";

interface DisplayCommentThreadProps {
    commentId: number;
    depth?: number;
}

export function DisplayCommentThread({commentId, depth = 0}: DisplayCommentThreadProps) {
    const [loading, setLoading] = useState<boolean>(true);
    const [comment, setComment] = useState<CommentResponse | null>(null);

    useEffect(() => {
        setLoading(true);

        commentAPI.findAllForParentId(commentId)
                .then((response) => {
                    setComment(response);
                })
                .catch((err) => {
                    console.error("Failed to fetch comment:", err);
                })
                .finally(() => {
                    setLoading(false);
                });
    }, [commentId]);


    if (loading) {
        return <Spin/>;
    }

    if (!comment) {
        return <Typography.Text type="secondary">No comments available.</Typography.Text>;
    }

    return (
            <List
                    dataSource={[comment]}
                    renderItem={(item) => (
                            <List.Item key={item.id} style={{width: "100%"}}>
                                <div style={{width: "100%"}}>
                                    <CommentCard comment={item}/>
                                    {item.childComments.length > 0 && (
                                            <div style={{marginTop: 8, marginLeft: 20}}>
                                                {item.childComments.map((child) => (
                                                        <DisplayCommentThread key={child.id} commentId={child.id} depth={depth + 1}/>
                                                ))}
                                            </div>
                                    )}
                                </div>
                            </List.Item>
                    )}
            />
    );
}
