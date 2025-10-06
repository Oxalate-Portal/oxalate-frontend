import {CommentTypeEnum} from "../../CommentTypeEnum";
import {CommentStatusEnum} from "../../CommentStatusEnum";
import {Dayjs} from "dayjs";

export interface CommentResponse {
    id: number;
    title: string;
    body: string;
    userId: number;
    username: string;
    avatarUrl?: string;
    registeredAt: string;
    parentCommentId: number;
    commentType: CommentTypeEnum;
    commentStatus: CommentStatusEnum;
    cancelReason: string;
    createdAt: Dayjs;
    updatedAt: Dayjs|null;
    childComments: CommentResponse[];
    childCount: number;
    userHasReported: boolean;
}