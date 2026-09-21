import {AbstractAPI} from "./AbstractAPI";
import type {AdminUserRequest, AdminUserResponse} from "../models";

/**
 * `/users` is a server-paged list endpoint: tables use {@link AbstractAPI.findPaged}, and `findAll()` walks through
 * every page for the non-table consumers.
 */
class AdminUserAPI extends AbstractAPI<AdminUserRequest, AdminUserResponse> {
    public override async findAll(params?: Record<string, string | number>): Promise<AdminUserResponse[]> {
        return this.findAllPaged(params);
    }
}

export const adminUserAPI = new AdminUserAPI("/users");
