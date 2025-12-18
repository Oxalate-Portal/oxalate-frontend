import {useEffect, useState} from "react";
import {commentAPI} from "../../services";
import type {CommentResponse} from "../../models";
import {Card, List, Space, Typography} from "antd";
import dayjs from "dayjs";

const {Text} = Typography;

export function Forum() {
    const [loading, setLoading] = useState<boolean>(true);
    const [comments, setComments] = useState<CommentResponse[]>([]);

    useEffect(() => {
        setLoading(true);

        Promise.all([
            commentAPI.findAllForParentIdWithDepth(3, 2)
        ])
                .then(([rootComment]) => {
                    setComments(rootComment.childComments);
                })
                .catch((error) => {
                    console.error("Failed to load comments:", error);
                })
                .finally(() => {
                    setLoading(false);
                });
    }, []);

    // Organize comments by parentCommentId
    const organizeComments = (comments: CommentResponse[]) => {
        const groupedComments: { [key: number]: CommentResponse[] } = {};

        comments.forEach((comment) => {
            const parentId = comment.parentCommentId;
            if (!groupedComments[parentId]) {
                groupedComments[parentId] = [];
            }
            groupedComments[parentId].push(comment);
        });

        return groupedComments;
    };

    const groupedComments = organizeComments(comments);

    // Recursive render for comments
    const renderComments = (parentId: number) => {
        if (!groupedComments[parentId]) {
            console.log("No comments found for parentId:", parentId);
            return null;
        }

        return (
                <div className={"darkDiv"}>
                    {!loading && <List
                            dataSource={groupedComments[parentId]}
                            renderItem={(comment) => (
                                    <List.Item key={comment.id}>
                                        <Card
                                                title={comment.title}
                                                bordered
                                                style={{width: "100%", marginBottom: 16}}
                                        >
                                            <Space orientation={"horizontal"}>
                                                <Text>{comment.username}</Text>
                                                <Text>
                                                    {dayjs(comment.createdAt).format("YYYY-MM-DD HH:mm")}
                                                </Text>
                                            </Space>
                                            <p style={{marginTop: 8}}>{comment.body}</p>
                                            {/* Render child comments recursively */}
                                            <div style={{marginLeft: 24}}>
                                                {renderComments(comment.id)}
                                            </div>
                                        </Card>
                                    </List.Item>
                            )}/>}
                </div>);
    };

    return (
            <div className={"darkDiv"}>
                <h1>Forum Topics</h1>
                {renderComments(3)} {/* Render top-level comments (parentCommentId: null) */}
            </div>
    );
}
