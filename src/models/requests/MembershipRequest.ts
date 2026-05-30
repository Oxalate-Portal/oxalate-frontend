import {MembershipStatusEnum} from "../MembershipStatusEnum";
import {MembershipTypeEnum} from "../MembershipTypeEnum";
import type {Dayjs} from "dayjs";

export interface MembershipRequest {
    id: number;
    userId: number;
    status: MembershipStatusEnum;
    type: MembershipTypeEnum;
    startDate: Dayjs | null;
    endDate: Dayjs | null;
}