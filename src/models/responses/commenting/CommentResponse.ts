import {CommentTypeEnum} from "../../CommentTypeEnum";
import {CommentStatusEnum} from "../../CommentStatusEnum";
import {Dayjs} from "dayjs";

export interface CommentResponse {
    id: number;
    title: string;
    body: string;
    user_id: number;
    username: string;
    avatar_url?: string;
    registered_at: string;
    parent_comment_id: number;
    comment_type: CommentTypeEnum;
    comment_status: CommentStatusEnum;
    cancel_reason: string;
    created_at: Dayjs;
    modified_at: Dayjs | null;
    child_comments: CommentResponse[];
    child_count: number;
    user_has_reported: boolean;
}
