import AbstractDiveEvent from "../AbstractDiveEvent";
import {UserResponse} from "./UserResponse";
import {DiveEventUserResponse} from "./DiveEventUserResponse";

export interface DiveEventResponse extends AbstractDiveEvent {
    organizer: UserResponse | null;
    participants: DiveEventUserResponse[];
}