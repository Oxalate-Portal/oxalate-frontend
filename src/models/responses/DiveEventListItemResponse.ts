import type {AbstractDiveEvent} from "../AbstractDiveEvent";
import type {TagResponse} from "./TagResponse";

export interface DiveEventListItemResponse extends AbstractDiveEvent {
    organizerName: string;
    participantCount: number;
    eventCommentId: number;
    tags?: TagResponse[];
}