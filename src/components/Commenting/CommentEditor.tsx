import React, { useState } from "react";
import { Button, Input } from "antd";
import { CommentRequest } from "../../models/requests";
import { commentAPI } from "../../services";
import { CommentTypeEnum } from "../../models";

interface CommentEditorProps {
    parentCommentId: number;
    onCommentSubmitted: () => void;
}

export function CommentEditor({ parentCommentId, onCommentSubmitted }: CommentEditorProps) {
    const [title, setTitle] = useState<string>("");
    const [body, setBody] = useState<string>("");
    const [submitting, setSubmitting] = useState<boolean>(false);

    const handleSubmit = async () => {
        if (!body.trim()) return;

        const newComment: CommentRequest = {
            id: 0,
            commentType: CommentTypeEnum.USER_COMMENT,
            title: title,
            body: body,
            parentCommentId: parentCommentId,
        };

        setSubmitting(true);
        try {
            await commentAPI.create(newComment);
            setTitle("");
            setBody("");
            onCommentSubmitted();
        } catch (err) {
            console.error("Failed to submit comment:", err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
            <div style={{ marginTop: 10 }}>
                <Input placeholder="Title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} />
                <Input.TextArea
                        placeholder="Write a comment..."
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        rows={3}
                        style={{ marginTop: 5 }}
                />
                <Button type="primary" onClick={handleSubmit} loading={submitting} style={{ marginTop: 5 }}>
                    Submit
                </Button>
            </div>
    );
}
