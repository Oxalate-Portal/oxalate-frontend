import type {Dayjs} from "dayjs";
import type {DiveGroupMemberResponse} from "./DiveGroupMemberResponse";

export interface DiveGroupResponse {
    id: number;
    eventId: number;
    name: string;
    ownerId: number;
    ownerName: string | null;
    groupOrder: number;
    createdAt: Dayjs;
    updatedAt: Dayjs | null;
    members: DiveGroupMemberResponse[];
}
