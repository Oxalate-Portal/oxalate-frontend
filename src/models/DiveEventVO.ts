import type {UserResponse} from "./responses";
import type {AbstractDiveEvent} from "./AbstractDiveEvent";

export interface DiveEventVO extends AbstractDiveEvent {
    organizer: UserResponse;
    participants: UserResponse[];
}