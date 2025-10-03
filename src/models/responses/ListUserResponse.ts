import {Dayjs} from "dayjs";
import {PaymentResponse} from "./PaymentResponse";
import {UserTypeEnum} from "../UserTypeEnum";
import {TagResponse} from "./TagResponse";

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