import {UserResponse} from "./responses";
import {AbstractDiveEvent} from "./AbstractDiveEvent";

export interface DiveEventVO extends AbstractDiveEvent {
    organizer: UserResponse;
    participants: UserResponse[];
}