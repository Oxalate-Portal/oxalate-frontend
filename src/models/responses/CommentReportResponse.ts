import {UpdateStatusEnum} from "../UpdateStatusEnum";

export interface CommentReportResponse {
    reporter: string;
    reporterId: number;
    reason: string;
    createdAt: string;
    status: UpdateStatusEnum;
}