import {CommentStatusEnum} from "../CommentStatusEnum";
import {CommentTypeEnum} from "../CommentTypeEnum";

export interface CommentFilterRequest {
    userId?: number;
    commentStatus?: CommentStatusEnum;
    commentType?: CommentTypeEnum;
    titleSearch?: string;
    bodySearch?: string;
    beforeDate?: Date;
    afterDate?: Date;
    reportCount?: number;
}