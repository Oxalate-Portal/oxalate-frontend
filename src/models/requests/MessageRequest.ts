import type {Dayjs} from "dayjs";

export interface MessageRequest {
    id: number;
    description: string;
    title: string;
    message: string;
    creator: number;
    createdAt?: Dayjs;
    recipients?: number[];
    sendAll?: boolean;
}
