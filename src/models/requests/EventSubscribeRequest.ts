import {UserTypeEnum} from "../UserTypeEnum";

export interface EventSubscribeRequest {
    dive_event_id: number;
    user_type: UserTypeEnum;
}
