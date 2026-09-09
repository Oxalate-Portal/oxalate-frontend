import {AbstractAPI} from "./AbstractAPI";
import type {ActionResponse, DiveGroupRequest, DiveGroupResponse, DiveGroupUpdateRequest} from "../models";

class DiveGroupAPI extends AbstractAPI<DiveGroupRequest, DiveGroupResponse> {
    public async getDiveGroupsByEventId(eventId: number): Promise<DiveGroupResponse[]> {
        const response = await this.axiosInstance.get<DiveGroupResponse[]>("/events/" + eventId);
        return response.data.map((diveGroup) => this.transformResponse(diveGroup));
    }

    public async getDiveGroupById(diveGroupId: number): Promise<DiveGroupResponse> {
        const response = await this.axiosInstance.get<DiveGroupResponse>("/" + diveGroupId);
        return this.transformResponse(response.data);
    }

    public async createDiveGroup(diveGroupRequest: DiveGroupRequest): Promise<DiveGroupResponse> {
        const response = await this.axiosInstance.post<DiveGroupResponse>("", this.serializeRequest(diveGroupRequest));
        return this.transformResponse(response.data);
    }

    public async updateDiveGroup(diveGroupId: number, diveGroupUpdateRequest: DiveGroupUpdateRequest): Promise<DiveGroupResponse> {
        const response = await this.axiosInstance.put<DiveGroupResponse>("/" + diveGroupId, this.serializeRequest(diveGroupUpdateRequest));
        return this.transformResponse(response.data);
    }

    public async deleteDiveGroup(diveGroupId: number): Promise<ActionResponse> {
        const response = await this.axiosInstance.delete<ActionResponse>("/" + diveGroupId);
        return response.data;
    }

    public async joinDiveGroup(diveGroupId: number): Promise<DiveGroupResponse> {
        const response = await this.axiosInstance.post<DiveGroupResponse>("/" + diveGroupId + "/members");
        return this.transformResponse(response.data);
    }

    public async leaveDiveGroup(diveGroupId: number): Promise<ActionResponse> {
        const response = await this.axiosInstance.delete<ActionResponse>("/" + diveGroupId + "/members");
        return response.data;
    }

    public async addMemberToDiveGroup(diveGroupId: number, userId: number): Promise<DiveGroupResponse> {
        const response = await this.axiosInstance.post<DiveGroupResponse>("/" + diveGroupId + "/members/" + userId);
        return this.transformResponse(response.data);
    }

    public async removeMemberFromDiveGroup(diveGroupId: number, userId: number): Promise<ActionResponse> {
        const response = await this.axiosInstance.delete<ActionResponse>("/" + diveGroupId + "/members/" + userId);
        return response.data;
    }
}

export const diveGroupAPI = new DiveGroupAPI("/dive-groups");
