import {AbstractAPI} from "./AbstractAPI";
import UserResponse from "../models/responses/UserResponse";
import UserStatusEnum from "../models/UserStatusEnum";

class UserAPI extends AbstractAPI<UserResponse> {

    public async updateUserStatus(userId: number, status: UserStatusEnum): Promise<UserResponse> {
        const response = await this.abstractAxios.post<UserResponse>(
            this.URLPREFIX + this.member + "/" + userId + "/status", {status: status});
        return response.data;
    }
}

const userAPI = new UserAPI("/users");
export default userAPI;