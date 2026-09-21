import {RoleEnum} from "../RoleEnum";

export interface RolePermissionResponse {
    id: number;
    page_id: number;
    role: RoleEnum;
    read_permission: boolean;
    write_permission: boolean;
}

