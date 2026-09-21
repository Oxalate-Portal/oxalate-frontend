import type {Dayjs} from "dayjs";
import {NotificationGroupEnum} from "../NotificationGroupEnum";

export interface MessageRequest {
    id: number;
    description: string;
    title: string;
    message: string;
    creator: number;
    created_at?: Dayjs;
    recipients?: number[];
    send_all?: boolean;
    notification_group?: NotificationGroupEnum;
    inactive_days?: number;
}

