import {Dayjs} from "dayjs";

export interface BlockedDateRequest {
    blocked_date: Dayjs;
    reason: string;
}
