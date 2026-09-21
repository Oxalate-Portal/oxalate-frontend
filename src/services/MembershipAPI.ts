import {AbstractAPI} from "./AbstractAPI";
import type {MembershipRequest, MembershipResponse, PagedRequest, PagedResponse} from "../models";

/**
 * `/memberships` is a server-paged list endpoint: tables use {@link AbstractAPI.findPaged}, and `findAll()` walks
 * through every page.
 */
class MembershipAPI extends AbstractAPI<MembershipRequest, MembershipResponse> {
    public override async findAll(params?: Record<string, string | number>): Promise<MembershipResponse[]> {
        return this.findAllPaged(params, "/paged");
    }

    public async findPaged(request: PagedRequest): Promise<PagedResponse<MembershipResponse>> {
        return super.findPaged(request, undefined, "/paged");
    }

    public async findByUserId(userId: number): Promise<MembershipResponse[]> {
        const response = await this.axiosInstance.get<MembershipResponse[]>("/user/" + userId);
        return response.data;
    }

    public async findByMemberId(membershipId: number): Promise<MembershipResponse> {
        const response = await this.axiosInstance.get<MembershipResponse>("/" + membershipId);
        return response.data;
    }
}

export const membershipAPI = new MembershipAPI("/memberships");
