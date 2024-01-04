import {PaymentTypeEnum} from "../PaymentTypeEnum";

export interface PaymentResponse {
    id: number;
    paymentType: PaymentTypeEnum;
    paymentCount: number;
    createdAt: Date;
    expiresAt: Date;
}