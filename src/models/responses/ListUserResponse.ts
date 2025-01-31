import {Dayjs} from "dayjs";
import {PaymentResponse} from "./PaymentResponse";

export interface ListUserResponse {
    id: number;
    name: string;
    eventDiveCount: number;
    createdAt: Dayjs;
    payments: PaymentResponse[];
    membershipActive: boolean;
}