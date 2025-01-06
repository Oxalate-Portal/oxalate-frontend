import {Dayjs} from "dayjs";
import {MembershipStatusEnum} from "../MembershipStatusEnum";
import {MembershipTypeEnum} from "../MembershipTypeEnum";

export interface MembershipResponse {
    id: number;
    userId: number;
    username: string;
    status: MembershipStatusEnum;
    type: MembershipTypeEnum;
    createdAt: Dayjs;
    expiresAt: Dayjs;
}