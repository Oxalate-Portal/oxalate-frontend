import type {Dayjs} from "dayjs";
import type {DiveGroupMemberResponse} from "./DiveGroupMemberResponse";
import type {DiveGroupTypeEnum} from "../DiveGroupTypeEnum";
import type {DiveFileResponse} from "./filetransfers/DiveFileResponse";

export interface DiveGroupResponse {
    id: number;
    eventId: number;
    name: string;
    ownerId: number;
    ownerName: string | null;
    groupType: DiveGroupTypeEnum;
    groupOrder: number;
    createdAt: Dayjs;
    updatedAt: Dayjs | null;
    members: DiveGroupMemberResponse[];
    diveFiles: DiveFileResponse[];
}
