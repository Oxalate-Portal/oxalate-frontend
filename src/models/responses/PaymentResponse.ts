import type {Dayjs} from "dayjs";
import {PaymentTypeEnum} from "../PaymentTypeEnum";

export interface PaymentResponse {
    id: number;
    userId: number;
    paymentType: PaymentTypeEnum;
    paymentCount: number;
    startDate: Dayjs;
    endDate: Dayjs;
    created: Dayjs;
    boundEvents: number[];
}