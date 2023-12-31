import AbstractDiveEvent from "./AbstractDiveEvent";
import {UserResponse} from "./responses";

export interface DiveEventVO extends AbstractDiveEvent {
    published: boolean;
    organizer: UserResponse;
    participants: UserResponse[];
}
