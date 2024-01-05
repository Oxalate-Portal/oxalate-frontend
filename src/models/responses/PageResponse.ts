import {PageVersionResponse} from "./PageVersionResponse";
import {RolePermissionResponse} from "./RolePermissionResponse";
import {AbstractPage} from "../AbstractPage";

export interface PageResponse extends AbstractPage {
    pageVersions: PageVersionResponse[];
    rolePermissions: RolePermissionResponse[];
}