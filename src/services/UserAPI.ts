import {AbstractAPI} from "./AbstractAPI";
import axios from "axios";
import {DiveEventUserResponse, UserResponse} from "../models/responses";
import {RoleEnum, UserStatusEnum} from "../models";
import {UserRequest} from "../models/requests";

class UserAPI extends AbstractAPI<UserRequest, UserResponse> {

    public async updateUserStatus(userId: number, status: UserStatusEnum): Promise<UserResponse> {
        this.setAuthorizationHeader()
        const response = await this.axiosInstance.post<UserResponse>("/" + userId + "/status", {status: status});
        return response.data;
    }

    public async acceptTerms(payload: { termAnswer: string }): Promise<boolean> {
        const response = await axios.put<void>("/accept-terms", payload);
        return response.status === 200;
    }

    public async findByRole(role: RoleEnum): Promise<DiveEventUserResponse[]> {
        this.setAuthorizationHeader()
        const response = await this.axiosInstance.get<DiveEventUserResponse[]>("/list/" + role);
        return response.data;
    }
}

export const userAPI = new UserAPI("/users");