import {PaymentTypeEnum} from "../PaymentTypeEnum";
import type {Dayjs} from "dayjs";

export interface PaymentRequest {
    id: number;
    user_id: number;
    payment_type: PaymentTypeEnum;
    payment_count: number;
    start_date: Dayjs;
    end_date: Dayjs | null;
}
