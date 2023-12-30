import {AbstractAPI} from "./AbstractAPI";
import UserResponse from "../models/responses/UserResponse";
import UserStatusEnum from "../models/UserStatusEnum";
import axios from "axios";

class UserAPI extends AbstractAPI<UserResponse> {

    public async updateUserStatus(userId: number, status: UserStatusEnum): Promise<UserResponse> {
        const response = await this.axiosInstance.post<UserResponse>("/" + userId + "/status", {status: status});
        return response.data;
    }

    async acceptTerms(payload: { termAnswer: string }): Promise<boolean> {
        const response = await axios.put<void>("/accept-terms", payload);
        return response.status === 200;
    }
}

const userAPI = new UserAPI("/users");
export default userAPI;