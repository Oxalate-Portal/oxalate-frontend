import {Dayjs} from "dayjs";
import {DiveEventStatusEnum} from "./DiveEventStatusEnum";
import {DiveTypeEnum} from "./DiveTypeEnum";

export interface AbstractDiveEvent {
    id: number;
    type: DiveTypeEnum;
    title: string;
    description: string;
    startTime: Dayjs;
    eventDuration: number;
    maxDuration: number;
    maxDepth: number;
    maxParticipants: number;
    status: DiveEventStatusEnum;
}
