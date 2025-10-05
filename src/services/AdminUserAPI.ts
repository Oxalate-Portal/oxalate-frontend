import {AbstractAPI} from "./AbstractAPI";
import type {AdminUserRequest, AdminUserResponse} from "../models";

class AdminUserAPI extends AbstractAPI<AdminUserRequest, AdminUserResponse> {
}

export const adminUserAPI = new AdminUserAPI("/users");
