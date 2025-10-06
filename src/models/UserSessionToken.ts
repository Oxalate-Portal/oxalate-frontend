import {RoleEnum} from "./RoleEnum";
import type {UserResponse} from "./responses";

export interface UserSessionToken extends UserResponse {
    accessToken: string;
    type: string;
    roles: RoleEnum[];
    expiresAt: Date;
}
