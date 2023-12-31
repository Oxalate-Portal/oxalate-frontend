import {RoleEnum} from "../RoleEnum";

export interface RolePermissionResponse {
    id: number;
    pageId: number;
    role: RoleEnum;
    readPermission: boolean;
    writePermission: boolean;
}

