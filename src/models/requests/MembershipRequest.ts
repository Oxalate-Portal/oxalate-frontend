import {MembershipStatusEnum} from "../MembershipStatusEnum";
import {MembershipTypeEnum} from "../MembershipTypeEnum";

export interface MembershipRequest {
    id: number;
    user_id: number;
    status: MembershipStatusEnum;
    type: MembershipTypeEnum;
    /** Membership dates are calendar dates, not instants in time. */
    start_date: string | null;
    end_date: string | null;
}
