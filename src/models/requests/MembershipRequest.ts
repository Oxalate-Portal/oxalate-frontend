import {MembershipStatusEnum} from "../MembershipStatusEnum";
import {MembershipTypeEnum} from "../MembershipTypeEnum";

export interface MembershipRequest {
    id: number;
    userId: number;
    status: MembershipStatusEnum;
    type: MembershipTypeEnum;
    startTime: string | null;
    endTime: string | null;
}