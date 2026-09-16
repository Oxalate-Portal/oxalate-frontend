import type {DiveGroupTypeEnum} from "../DiveGroupTypeEnum";

export interface DiveGroupRequest {
    eventId: number;
    name: string;
    ownerId?: number | null;
    groupType?: DiveGroupTypeEnum;
    memberIds?: number[];
}
