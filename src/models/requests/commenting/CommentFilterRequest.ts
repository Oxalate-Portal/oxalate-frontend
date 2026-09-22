import {CommentStatusEnum} from "../../CommentStatusEnum";
import {CommentTypeEnum} from "../../CommentTypeEnum";
import {CommentClassEnum} from "../../CommentClassEnum";

export interface CommentFilterRequest {
    user_id?: number;
    comment_class?: CommentClassEnum;
    comment_status?: CommentStatusEnum;
    comment_type?: CommentTypeEnum;
    title_search?: string;
    body_search?: string;
    before_date?: Date;
    after_date?: Date;
    report_count?: number;
}
