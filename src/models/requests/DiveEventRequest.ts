import type {AbstractDiveEvent} from "../AbstractDiveEvent";

export interface DiveEventRequest extends AbstractDiveEvent {
    organizer_id: number;
    participants: number[];
}
