import RoleEnum from "../RoleEnum";

interface RolePermissionResponse {
    id: number;
    pageId: number;
    role: RoleEnum;
    readPermission: boolean;
    writePermission: boolean;
};

export default RolePermissionResponse;

