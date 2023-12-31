import {PageStatusEnum} from "../index";
import {PageVersionResponse} from "./PageVersionResponse";
import {RolePermissionResponse} from "./RolePermissionResponse";

export interface PageResponse {
    id: number;
    status: PageStatusEnum;
    pageGroupId: number;
    pageVersions: PageVersionResponse[];
    rolePermissions: RolePermissionResponse[];
    creator: number;
    createdAt: Date;
    modifier: number | null;
    modifiedAt: Date | null;
}
