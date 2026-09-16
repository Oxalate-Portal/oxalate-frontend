import type {DiveGroupTypeEnum} from "../DiveGroupTypeEnum";

export interface DiveGroupUpdateRequest {
    name: string;
    ownerId?: number | null;
    groupType?: DiveGroupTypeEnum;
}
