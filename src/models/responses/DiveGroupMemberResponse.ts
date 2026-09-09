import type {Dayjs} from "dayjs";
import type {UserTypeEnum} from "../UserTypeEnum";

export interface DiveGroupMemberResponse {
    userId: number;
    name: string;
    userType: UserTypeEnum;
    owner: boolean;
    joinedAt: Dayjs;
}
