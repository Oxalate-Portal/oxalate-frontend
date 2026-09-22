import type {DiveGroupTypeEnum} from "../DiveGroupTypeEnum";

export interface DiveGroupUpdateRequest {
    name: string;
    description?: string | null;
    owner_id?: number | null;
    group_type?: DiveGroupTypeEnum;
}
