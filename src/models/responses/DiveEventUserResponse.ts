import {Dayjs} from "dayjs";
import {PaymentResponse} from "./PaymentResponse";

export interface DiveEventUserResponse {
    id: number;
    name: string;
    eventDiveCount: number;
    createdAt: Dayjs;
    payments: PaymentResponse[];
}