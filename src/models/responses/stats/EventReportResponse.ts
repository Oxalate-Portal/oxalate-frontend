import type {Dayjs} from "dayjs";

export interface EventReportResponse {
    event_id: number;
    event_date_time: Dayjs;
    organizer_name: string;
    participant_count: number;
    dive_count: number;
}
