import type {Dayjs} from "dayjs";
import type {DiveGroupMemberResponse} from "./DiveGroupMemberResponse";
import type {DiveGroupTypeEnum} from "../DiveGroupTypeEnum";
import type {DiveFileResponse} from "./filetransfers/DiveFileResponse";

export interface DiveGroupResponse {
    id: number;
    event_id: number;
    name: string;
    description: string | null;
    owner_id: number;
    owner_name: string | null;
    group_type: DiveGroupTypeEnum;
    group_order: number;
    created_at: Dayjs;
    updated_at: Dayjs | null;
    members: DiveGroupMemberResponse[];
    dive_files: DiveFileResponse[];
}
