import {PaymentTypeEnum} from "../PaymentTypeEnum";

export interface PaymentRequest {
    id: number;
    userId: number;
    paymentType: PaymentTypeEnum;
    paymentCount: number;
    startTime: Date;
    endTime: Date;
}