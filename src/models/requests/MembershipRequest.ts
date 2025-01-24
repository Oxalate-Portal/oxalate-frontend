import {MembershipStatusEnum} from "../MembershipStatusEnum";
import {MembershipTypeEnum} from "../MembershipTypeEnum";

export interface MembershipRequest {
    id: number;
    userId: number;
    status: MembershipStatusEnum;
    type: MembershipTypeEnum;
}