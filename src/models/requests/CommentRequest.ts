import {CommentTypeEnum} from "../CommentTypeEnum";
import {CommentStatusEnum} from "../CommentStatusEnum";

export interface CommentRequest {
    id: number;
    title: string;
    body: string;
    parentCommentId: number;
    commentType: CommentTypeEnum;
    commentStatus: CommentStatusEnum;
    cancelReason: string
}

