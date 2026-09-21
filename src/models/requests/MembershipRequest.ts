import {MembershipStatusEnum} from "../MembershipStatusEnum";
import {MembershipTypeEnum} from "../MembershipTypeEnum";
import type {Dayjs} from "dayjs";

export interface MembershipRequest {
    id: number;
    user_id: number;
    status: MembershipStatusEnum;
    type: MembershipTypeEnum;
    start_date: Dayjs | null;
    end_date: Dayjs | null;
}
