import type {DiveGroupTypeEnum} from "../DiveGroupTypeEnum";

export interface DiveGroupUpdateRequest {
    name: string;
    description?: string | null;
    ownerId?: number | null;
    groupType?: DiveGroupTypeEnum;
}
