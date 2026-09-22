import type {Dayjs} from "dayjs";
import type {UserTypeEnum} from "../UserTypeEnum";

export interface DiveGroupMemberResponse {
    user_id: number;
    name: string;
    user_type: UserTypeEnum;
    owner: boolean;
    joined_at: Dayjs;
}
