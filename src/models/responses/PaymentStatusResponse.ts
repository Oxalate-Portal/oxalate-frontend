import {UpdateStatusEnum} from "../UpdateStatusEnum";
import type {PaymentResponse} from "./PaymentResponse";

export interface PaymentStatusResponse {
    user_id: number;
    name: string;
    status: UpdateStatusEnum;
    payments: PaymentResponse[];

}
