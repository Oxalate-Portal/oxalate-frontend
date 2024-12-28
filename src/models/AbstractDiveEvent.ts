import {Dayjs} from "dayjs";
import {DiveEventStatusEnum} from "./DiveEventStatusEnum";

export interface AbstractDiveEvent {
    id: number;
    type: string;
    title: string;
    description: string;
    startTime: Dayjs;
    eventDuration: number;
    maxDuration: number;
    maxDepth: number;
    maxParticipants: number;
    status: DiveEventStatusEnum;
}
