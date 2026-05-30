import {PaymentTypeEnum} from "../../PaymentTypeEnum";
import type {Dayjs} from "dayjs";

export interface DownloadPaymentResponse {
    id: number;
    userId: number;
    name: string;
    paymentCount: number;
    paymentType: PaymentTypeEnum;
    created: Dayjs;
}