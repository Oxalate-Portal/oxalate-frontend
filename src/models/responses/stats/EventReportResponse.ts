import type {Dayjs} from "dayjs";

export interface EventReportResponse {
    eventId: number;
    eventDateTime: Dayjs;
    organizerName: string;
    participantCount: number;
    diveCount: number;
}