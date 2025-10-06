import type {EventReportResponse} from "./EventReportResponse";

export interface EventPeriodReportResponse {
    periodStart: Date;
    period: string;
    events: EventReportResponse[];
}