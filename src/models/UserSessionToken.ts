import {AbstractUser} from "./AbstractUser";
import {RoleEnum} from "./RoleEnum";
import {UserResponse} from "./responses";

export interface UserSessionToken extends UserResponse {
    accessToken: string;
    type: string;
    roles: RoleEnum[];
    expiresAt: Date;
}
