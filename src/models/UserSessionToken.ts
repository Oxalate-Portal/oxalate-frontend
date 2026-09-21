import {RoleEnum} from "./RoleEnum";
import type {UserResponse} from "./responses";

export interface UserSessionToken extends UserResponse {
    access_token: string;
    type: string;
    roles: RoleEnum[];
    expires_at: Date;
}
