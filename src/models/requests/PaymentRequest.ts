import {PaymentTypeEnum} from "../PaymentTypeEnum";

export interface PaymentRequest {
    id: number;
    user_id: number;
    payment_type: PaymentTypeEnum;
    payment_count: number;
    /** Payment dates are calendar dates, not instants in time. */
    start_date: string;
    end_date: string | null;
}
