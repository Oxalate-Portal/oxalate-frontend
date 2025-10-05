import {Dayjs} from "dayjs";

export interface BlockedDateRequest {
    blockedDate: Dayjs;
    reason: string;
}