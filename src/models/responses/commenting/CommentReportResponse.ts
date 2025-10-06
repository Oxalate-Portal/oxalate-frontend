import {ReportStatusEnum} from "../../ReportStatusEnum";

export interface CommentReportResponse {
    id: number;
    reporter: string;
    reporterId: number;
    reason: string;
    createdAt: string;
    status: ReportStatusEnum;
}