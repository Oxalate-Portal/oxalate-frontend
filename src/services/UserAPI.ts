import {AbstractAPI} from "./AbstractAPI";
import {
    type AdminUserRequest,
    type AdminUserResponse,
    type ConfirmationRequest,
    type ListUserResponse,
    RoleEnum,
    type UserRequest,
    type UserResponse,
    UserStatusEnum
} from "../models";

class UserAPI extends AbstractAPI<UserRequest, UserResponse> {
    /**
     * `/users` only exists as a server-paged list; this walks through every page for the select boxes and exports
     * that need the whole member list.
     */
    public override async findAll(params?: Record<string, string | number>): Promise<UserResponse[]> {
        return this.findAllPaged(params);
    }

    public async updateUserStatus(userId: number, status: UserStatusEnum): Promise<UserResponse> {
        const response = await this.axiosInstance.put<UserResponse>("/" + userId + "/status", {status: status});
        return response.data;
    }

    public async acceptTerms(payload: ConfirmationRequest): Promise<void> {
        await this.axiosInstance.put<void>("/accept-terms", payload);
    }

    public async acceptHealthStatement(payload: ConfirmationRequest): Promise<void> {
        await this.axiosInstance.put<void>("/confirm-health-check", payload);
    }

    public async findByRole(role: RoleEnum): Promise<ListUserResponse[]> {
        const response = await this.axiosInstance.get<ListUserResponse[]>("/role/" + role);
        return response.data;
    }

    public async findAdminUserById(userId: number): Promise<AdminUserResponse> {
        this.axiosInstance.defaults.headers.put["Content-Type"] = "application/json;charset=utf-8";
        const response = await this.axiosInstance.get<AdminUserResponse>("/" + userId);
        return response.data;
    }

    public async resetTerms(): Promise<boolean> {
        const response = await this.axiosInstance.get<AdminUserResponse>("/reset-terms");
        return response.status === 200;
    }

    public async resetHealthStatement(): Promise<boolean> {
        const response = await this.axiosInstance.get<AdminUserResponse>("/reset-health-check");
        return response.status === 200;
    }

    // TODO Convert the post data to an interface, requires reworking of the whole user data handling starting with AbstractUser
    public async adminUpdateUser(postData: AdminUserRequest) {
        this.axiosInstance.defaults.headers.put["Content-Type"] = "application/json;charset=utf-8";
        const response = await this.axiosInstance.put<AdminUserResponse>("", postData);
        return response.data;
    }
}

export const userAPI = new UserAPI("/users");
