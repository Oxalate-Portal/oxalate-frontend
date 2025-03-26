import {CommentStatusEnum} from "../CommentStatusEnum";
import {CommentTypeEnum} from "../CommentTypeEnum";
import {CommentClassEnum} from "../CommentClassEnum";

export interface CommentFilterRequest {
    userId?: number;
    commentClass?: CommentClassEnum;
    commentStatus?: CommentStatusEnum;
    commentType?: CommentTypeEnum;
    titleSearch?: string;
    bodySearch?: string;
    beforeDate?: Date;
    afterDate?: Date;
    reportCount?: number;
}