import AbstractDiveEvent from "../AbstractDiveEvent";

export interface DiveEventListItemResponse extends AbstractDiveEvent {
    published: boolean;
    organizerName: string;
    participantCount: number;
}
