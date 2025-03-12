import {AbstractDiveEvent} from "../AbstractDiveEvent";

export interface DiveEventListItemResponse extends AbstractDiveEvent {
    organizerName: string;
    participantCount: number;
    eventCommentId: number;
}