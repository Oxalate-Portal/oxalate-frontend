import {UserResponse} from "./UserResponse";
import {RoleEnum} from "../RoleEnum";

export interface AdminUserResponse extends UserResponse {
    roles: RoleEnum[];
    lastSeen: Date | null;
}