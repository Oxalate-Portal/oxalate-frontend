import {PaymentTypeEnum} from "../../PaymentTypeEnum";

export interface DownloadPaymentResponse {
    id: number;
    userId: number;
    name: string;
    paymentCount: number;
    paymentType: PaymentTypeEnum;
    created: Date;
}