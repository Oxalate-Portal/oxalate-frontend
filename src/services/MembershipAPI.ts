import {AbstractAPI} from "./AbstractAPI";
import {MembershipRequest} from "../models/requests";
import {MembershipResponse} from "../models/responses";

class MembershipAPI extends AbstractAPI<MembershipRequest, MembershipResponse> {
    public async findByUserId(userId: number): Promise<MembershipResponse[]> {
        this.setAuthorizationHeader();
        const response = await this.axiosInstance.get<MembershipResponse[]>("/user/" + userId);
        return response.data;
    }

    public async findByMemberId(membershipId: number): Promise<MembershipResponse> {
        this.setAuthorizationHeader();
        const response = await this.axiosInstance.get<MembershipResponse>("/" + membershipId);
        return response.data;
    }
}

export const membershipAPI = new MembershipAPI("/memberships");