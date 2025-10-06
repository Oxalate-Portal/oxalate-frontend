import {UpdateStatusEnum} from "../UpdateStatusEnum";
import type {PaymentResponse} from "./PaymentResponse";

export interface PaymentStatusResponse {
    userId: number;
    name: string;
    status: UpdateStatusEnum;
    payments: PaymentResponse[];

}
