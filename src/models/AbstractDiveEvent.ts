import {DiveEventStatusEnum} from "./DiveEventStatusEnum";

export interface AbstractDiveEvent {
    id: number;
    type: string;
    title: string;
    description: string;
    startTime: Date;
    eventDuration: number;
    maxDuration: number;
    maxDepth: number;
    maxParticipants: number;
    status: DiveEventStatusEnum;
}
