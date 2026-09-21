import {Dayjs} from "dayjs";
import {MembershipStatusEnum} from "../MembershipStatusEnum";
import {MembershipTypeEnum} from "../MembershipTypeEnum";

export interface MembershipResponse {
    id: number;
    user_id: number;
    username: string;
    status: MembershipStatusEnum;
    type: MembershipTypeEnum;
    created: Dayjs;
    start_date: Dayjs;
    end_date: Dayjs;
}
