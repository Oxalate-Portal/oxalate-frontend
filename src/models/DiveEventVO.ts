import AbstractDiveEvent from "./AbstractDiveEvent";
import {UserResponse} from "./responses";

export interface DiveEventVO extends AbstractDiveEvent {
    organizer: UserResponse;
    participants: UserResponse[];
}