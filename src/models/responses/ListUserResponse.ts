import {Dayjs} from "dayjs";
import {PaymentResponse} from "./PaymentResponse";
import {UserTypeEnum} from "../UserTypeEnum";

export interface ListUserResponse {
    id: number;
    name: string;
    eventDiveCount: number;
    createdAt: Dayjs;
    payments: PaymentResponse[];
    membershipActive: boolean;
    userType: UserTypeEnum;
}