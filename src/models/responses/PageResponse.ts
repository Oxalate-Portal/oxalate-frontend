import type {PageVersionResponse} from "./PageVersionResponse";
import type {RolePermissionResponse} from "./RolePermissionResponse";
import type {AbstractPage} from "../AbstractPage";

export interface PageResponse extends AbstractPage {
    pageVersions: PageVersionResponse[];
    rolePermissions: RolePermissionResponse[];
}