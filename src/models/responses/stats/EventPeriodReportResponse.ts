import type {EventReportResponse} from "./EventReportResponse";

export interface EventPeriodReportResponse {
    period_start: Date;
    period: string;
    events: EventReportResponse[];
}
