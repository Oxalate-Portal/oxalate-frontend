import type {Dayjs} from "dayjs";

export interface BlockedDateResponse {
    id: number;
    blockedDate: Dayjs;
    createdAt: Dayjs;
    creatorName: string;
    reason: string;
}