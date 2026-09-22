import type {UserResponse} from "./UserResponse";
import type {ListUserResponse} from "./ListUserResponse";
import type {AbstractDiveEvent} from "../AbstractDiveEvent";

export interface DiveEventResponse extends AbstractDiveEvent {
    organizer: UserResponse | null;
    participants: ListUserResponse[];
    waiting_list: ListUserResponse[];
    event_comment_id: number;
}
