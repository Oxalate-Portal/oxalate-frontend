import {UserResponse} from "./UserResponse";
import {DiveEventUserResponse} from "./DiveEventUserResponse";
import {AbstractDiveEvent} from "../AbstractDiveEvent";

export interface DiveEventResponse extends AbstractDiveEvent {
    organizer: UserResponse | null;
    participants: DiveEventUserResponse[];
}