import { Avatar, Button, Card, Space, Typography } from "antd";
import { UserOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useState } from "react";
import { CommentResponse } from "../../models/responses";

interface CommentCardProps {
    comment: CommentResponse;
}

export function CommentCard({comment}: CommentCardProps) {
    const [avatarComponent, setAvatarComponent] = useState<React.ReactNode>(<Avatar icon={<UserOutlined />} size={64} />);

    if (comment.avatarUrl !== null && comment.avatarUrl !== undefined) {
        setAvatarComponent(<Avatar src={comment.avatarUrl} size={40} style={{ marginRight: 12 }} />);
    }

    return (
            <Card style={{ marginBottom: 16, width: "100%" }}>
                <Space direction={"vertical"} size={"large"} style={{ width: "100%" }}>
                    <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
                        {avatarComponent}
                        <div>
                            <Typography.Text strong>{comment.username} (#{comment.id})</Typography.Text>
                            <br />
                            <Typography.Text type="secondary">
                                Registered: {comment.registeredAt === null ? "1970-01-01" : dayjs(comment.registeredAt).format("YYYY-MM-DD")}
                            </Typography.Text>
                        </div>
                    </div>
                    <Typography.Title level={5}>{comment.title}</Typography.Title>
                    <Typography.Text>{comment.body}</Typography.Text>
                    <Typography.Text type="secondary">
                        Commented: {dayjs(comment.createdAt).format("YYYY-MM-DD HH:mm")}
                    </Typography.Text>
                    {comment.updatedAt && (
                            <Typography.Text type="secondary" style={{ marginLeft: 8 }}>
                                (Edited: {dayjs(comment.updatedAt).format("YYYY-MM-DD HH:mm")})
                            </Typography.Text>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <Button>Respond</Button>
                        <Button danger>Report inappropriate comment</Button>
                    </div>
                </Space>
            </Card>
    );
}
