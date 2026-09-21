import type {UserResponse} from "./UserResponse";
import {RoleEnum} from "../RoleEnum";
import type {Dayjs} from "dayjs";

export interface AdminUserResponse extends UserResponse {
    roles: RoleEnum[];
    last_seen: Dayjs | null;
}
