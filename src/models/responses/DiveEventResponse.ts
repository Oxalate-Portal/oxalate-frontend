import {UserResponse} from "./UserResponse";
import {ListUserResponse} from "./ListUserResponse";
import {AbstractDiveEvent} from "../AbstractDiveEvent";

export interface DiveEventResponse extends AbstractDiveEvent {
    organizer: UserResponse | null;
    participants: ListUserResponse[];
    eventCommentId: number;
}