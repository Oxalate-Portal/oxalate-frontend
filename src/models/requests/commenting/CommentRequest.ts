import {CommentTypeEnum} from "../../CommentTypeEnum";

export interface CommentRequest {
    id: number;
    title: string;
    body: string;
    comment_type: CommentTypeEnum;
    parent_comment_id: number;
}

