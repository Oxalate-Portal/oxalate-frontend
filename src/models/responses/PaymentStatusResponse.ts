import {UpdateStatusEnum} from "../UpdateStatusEnum";
import {PaymentResponse} from "./PaymentResponse";

export interface PaymentStatusResponse {
    userId: number;
    name: string;
    status: UpdateStatusEnum;
    payments: PaymentResponse[];

}
