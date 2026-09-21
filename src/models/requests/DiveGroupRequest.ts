import type {DiveGroupTypeEnum} from "../DiveGroupTypeEnum";

export interface DiveGroupRequest {
    event_id: number;
    name: string;
    description?: string | null;
    owner_id?: number | null;
    group_type?: DiveGroupTypeEnum;
    member_ids?: number[];
}
