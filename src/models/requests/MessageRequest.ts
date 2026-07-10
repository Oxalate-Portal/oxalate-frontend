import type {Dayjs} from "dayjs";
import {NotificationGroupEnum} from "../NotificationGroupEnum";

export interface MessageRequest {
    id: number;
    description: string;
    title: string;
    message: string;
    creator: number;
    createdAt?: Dayjs;
    recipients?: number[];
    sendAll?: boolean;
    notificationGroup?: NotificationGroupEnum;
    inactiveDays?: number;
}

