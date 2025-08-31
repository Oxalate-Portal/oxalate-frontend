import {UserTypeEnum} from "../UserTypeEnum";

export interface EventSubscribeRequest {
    diveEventId: number;
    userType: UserTypeEnum;
}