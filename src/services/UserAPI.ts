import {AbstractAPI} from "./AbstractAPI";
import {DiveEventUserResponse, UserResponse} from "../models/responses";
import {RoleEnum, UserStatusEnum} from "../models";
import {UserRequest} from "../models/requests";
import {AdminUserResponse} from "../models/responses/AdminUserResponse";

class UserAPI extends AbstractAPI<UserRequest, UserResponse> {

    public async updateUserStatus(userId: number, status: UserStatusEnum): Promise<UserResponse> {
        this.setAuthorizationHeader()
        const response = await this.axiosInstance.post<UserResponse>("/" + userId + "/status", {status: status});
        return response.data;
    }

    public async acceptTerms(payload: { termAnswer: string }): Promise<boolean> {
        const response = await this.axiosInstance.put<void>("/accept-terms", payload);
        return response.status === 200;
    }

    public async findByRole(role: RoleEnum): Promise<DiveEventUserResponse[]> {
        this.setAuthorizationHeader()
        const response = await this.axiosInstance.get<DiveEventUserResponse[]>("/role/" + role);
        return response.data;
    }

    public async findAdminUserById(userId: number): Promise<AdminUserResponse> {
        this.setAuthorizationHeader()
        this.axiosInstance.defaults.headers.put['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.get<AdminUserResponse>("/" + userId);
        return response.data;
    }

    public async resetTerms(): Promise<boolean> {
        this.setAuthorizationHeader()
        const response = await this.axiosInstance.get<AdminUserResponse>("/reset-terms");
        return response.status === 200;
    }

    // TODO Convert the post data to an interface, requires reworking of the whole user data handling starting with AbstractUser
    public async adminUpdateUser(postData: {
        firstName: string;
        lastName: string;
        phoneNumber: string;
        nextOfKin: string;
        roles: RoleEnum[];
        privacy: boolean;
        registered: Date;
        language: string;
        id: number;
        username: string;
        status: UserStatusEnum
    }) {
        this.setAuthorizationHeader()
        this.axiosInstance.defaults.headers.put['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.put<AdminUserResponse>("", postData);
        return response.data;
    }
}

export const userAPI = new UserAPI("/users");