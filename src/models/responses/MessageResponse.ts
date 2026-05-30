import type {Dayjs} from "dayjs";

export interface MessageResponse {
    id: number;
    description: string;
    title: string;
    message: string;
    creator: number;
    createdAt: Dayjs;
    read?: boolean;
}
