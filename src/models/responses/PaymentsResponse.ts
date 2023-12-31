import {PaymentTypeEnum} from "../PaymentTypeEnum";

export interface PaymentsResponse {
    id: number;
    paymentType: PaymentTypeEnum;
    paymentCount: number;
    createdAt: Date;
    expiresAt: Date;
}
