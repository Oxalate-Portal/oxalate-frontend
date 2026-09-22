import {DiveEventStatusEnum} from "./DiveEventStatusEnum";
import {DiveTypeEnum} from "./DiveTypeEnum";
import type {Dayjs} from "dayjs";

export interface AbstractDiveEvent {
    id: number;
    type: DiveTypeEnum;
    title: string;
    description: string;
    start_time: Dayjs;
    event_duration: number;
    max_duration: number;
    max_depth: number;
    max_participants: number;
    status: DiveEventStatusEnum;
}
