import {Dayjs} from "dayjs";
import type {PaymentResponse} from "./PaymentResponse";
import {UserTypeEnum} from "../UserTypeEnum";
import type {TagResponse} from "./TagResponse";

export interface ListUserResponse {
    id: number;
    name: string;
    eventDiveCount: number;
    createdAt: Dayjs;
    payments: PaymentResponse[];
    membershipActive: boolean;
    userType: UserTypeEnum;
    tags?: TagResponse[];
}