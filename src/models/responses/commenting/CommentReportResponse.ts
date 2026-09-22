import {ReportStatusEnum} from "../../ReportStatusEnum";
import type {Dayjs} from "dayjs";

export interface CommentReportResponse {
    id: number;
    reporter: string;
    reporter_id: number;
    reason: string;
    created_at: Dayjs;
    status: ReportStatusEnum;
}
