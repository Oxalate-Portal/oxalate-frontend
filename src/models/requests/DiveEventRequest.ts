import type {AbstractDiveEvent} from "../AbstractDiveEvent";

export interface DiveEventRequest extends AbstractDiveEvent {
    organizerId: number;
    participants: number[];
}