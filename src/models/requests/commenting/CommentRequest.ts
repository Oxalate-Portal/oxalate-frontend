import {CommentTypeEnum} from "../../CommentTypeEnum";

export interface CommentRequest {
    id: number;
    title: string;
    body: string;
    commentType: CommentTypeEnum;
    parentCommentId: number;
}

