import type {DiveGroupTypeEnum} from "../DiveGroupTypeEnum";

export interface DiveGroupRequest {
    eventId: number;
    name: string;
    description?: string | null;
    ownerId?: number | null;
    groupType?: DiveGroupTypeEnum;
    memberIds?: number[];
}
