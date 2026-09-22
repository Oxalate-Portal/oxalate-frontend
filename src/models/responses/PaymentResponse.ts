import type {Dayjs} from "dayjs";
import {PaymentTypeEnum} from "../PaymentTypeEnum";

export interface PaymentResponse {
    id: number;
    user_id: number;
    payment_type: PaymentTypeEnum;
    payment_count: number;
    start_date: Dayjs;
    end_date: Dayjs;
    created: Dayjs;
    bound_events: number[] | null;
}
