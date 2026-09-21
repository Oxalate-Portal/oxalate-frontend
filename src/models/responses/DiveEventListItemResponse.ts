import type {AbstractDiveEvent} from "../AbstractDiveEvent";
import type {TagResponse} from "./TagResponse";

export interface DiveEventListItemResponse extends AbstractDiveEvent {
    organizer_name: string;
    participant_count: number;
    waiting_list_count: number;
    event_comment_id: number;
    tags?: TagResponse[];
}
