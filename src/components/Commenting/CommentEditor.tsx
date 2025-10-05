import {useState} from "react";
import {Button, Input} from "antd";
import {type CommentRequest, CommentTypeEnum} from "../../models";
import {commentAPI} from "../../services";
import {useTranslation} from "react-i18next";

interface CommentEditorProps {
    parentCommentId: number;
    refreshCommentList: () => void;
}

export function CommentEditor({ parentCommentId, refreshCommentList }: CommentEditorProps) {
    const [title, setTitle] = useState<string>("");
    const [body, setBody] = useState<string>("");
    const [submitting, setSubmitting] = useState<boolean>(false);
    const {t} = useTranslation();

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
            refreshCommentList();
        } catch (err) {
            console.error("Failed to submit comment:", err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
            <div style={{ marginTop: 10 }}>
                <Input placeholder={t("CommentEditor.form.title.placeholder")} value={title} onChange={(e) => setTitle(e.target.value)} />
                <Input.TextArea
                        placeholder={t("CommentEditor.form.textarea.placeholder")}
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        rows={3}
                        style={{ marginTop: 5 }}
                />
                <Button type="primary" onClick={handleSubmit} loading={submitting} style={{ marginTop: 5 }}>
                    {t("common.button.send")}
                </Button>
            </div>
    );
}
