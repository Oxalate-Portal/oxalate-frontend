import type {AbstractUser} from "../AbstractUser";
import {RoleEnum} from "../RoleEnum";

export interface AdminUserRequest extends AbstractUser {
    roles: RoleEnum[];
}