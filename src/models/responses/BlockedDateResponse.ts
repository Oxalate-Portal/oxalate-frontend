import type {Dayjs} from "dayjs";

export interface BlockedDateResponse {
    id: number;
    blocked_date: Dayjs;
    created_at: Dayjs;
    creator_name: string;
    reason: string;
}
