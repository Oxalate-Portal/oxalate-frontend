import {PaymentTypeEnum} from "../PaymentTypeEnum";
import type {Dayjs} from "dayjs";

export interface PaymentRequest {
    id: number;
    userId: number;
    paymentType: PaymentTypeEnum;
    paymentCount: number;
    startDate: Dayjs;
    endDate: Dayjs | null;
}