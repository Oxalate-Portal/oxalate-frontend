import {ReportStatusEnum} from "../../ReportStatusEnum";
import type {Dayjs} from "dayjs";

export interface CommentReportResponse {
    id: number;
    reporter: string;
    reporterId: number;
    reason: string;
    createdAt: Dayjs;
    status: ReportStatusEnum;
}