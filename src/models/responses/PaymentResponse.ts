import {PaymentTypeEnum} from "../PaymentTypeEnum";

export interface PaymentResponse {
    id: number;
    userId: number;
    paymentType: PaymentTypeEnum;
    paymentCount: number;
    startDate: Date;
    endDate: Date;
    created: Date;
    boundEvents: number[];
}