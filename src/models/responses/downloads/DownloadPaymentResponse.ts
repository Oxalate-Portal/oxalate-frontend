import {PaymentTypeEnum} from "../../PaymentTypeEnum";
import type {Dayjs} from "dayjs";

export interface DownloadPaymentResponse {
    id: number;
    user_id: number;
    name: string;
    payment_count: number;
    payment_type: PaymentTypeEnum;
    created: Dayjs;
}
