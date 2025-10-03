import {AbstractDiveEvent} from "../AbstractDiveEvent";
import {TagResponse} from "./TagResponse";

export interface DiveEventListItemResponse extends AbstractDiveEvent {
    organizerName: string;
    participantCount: number;
    eventCommentId: number;
    tags?: TagResponse[];
}