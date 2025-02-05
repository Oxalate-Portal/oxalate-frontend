import {PaymentTypeEnum} from "../PaymentTypeEnum";

export interface PaymentResponse {
    id: number;
    userId: number;
    paymentType: PaymentTypeEnum;
    paymentCount: number;
    createdAt: Date;
    expiresAt: Date;
    boundEvents: number[];
}