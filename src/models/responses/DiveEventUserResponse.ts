import {PaymentResponse} from "./PaymentResponse";

export interface DiveEventUserResponse {
    id: number;
    name: string;
    eventDiveCount: number;
    payments: PaymentResponse[];
}