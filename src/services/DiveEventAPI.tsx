import {AbstractAPI} from "./AbstractAPI";
import type {
    DiveEventListItemResponse,
    DiveEventListRequest,
    DiveEventListResponse,
    DiveEventRequest,
    DiveEventResponse,
    EventSubscribeRequest,
    PagedRequest,
    PagedResponse
} from "../models";

class DiveEventAPI extends AbstractAPI<DiveEventRequest, DiveEventResponse> {
    public async findByUserId(userId: number): Promise<DiveEventResponse[]> {
        const response = await this.axiosInstance.get<DiveEventResponse[]>("/user/" + userId);
        return response.data;
    }

    public async findAllDiveEventListItems(): Promise<DiveEventListItemResponse[]> {
        const response = await this.axiosInstance.get<DiveEventListItemResponse[]>("/");
        return response.data;
    }

    public async findAllDiveEventListItemsByUser(userId: number): Promise<DiveEventListItemResponse[]> {
        const response = await this.axiosInstance.get<DiveEventListItemResponse[]>("/user/" + userId);
        return response.data;
    }

    public async findAllOngoingDiveEvents(): Promise<DiveEventResponse[]> {
        const response = await this.axiosInstance.get<DiveEventResponse[]>("/ongoing");
        return response.data;
    }

    /**
     * Fetches one page of the past dive events, sorted and searched on the server.
     */
    public async findPastDiveEvents(request: PagedRequest): Promise<PagedResponse<DiveEventResponse>> {
        return this.findPaged(request, undefined, "/past");
    }

    /**
     * Collects every past dive event by walking through the pages of `/events/past`; used by the data export.
     */
    public async findAllPastDiveEvents(): Promise<DiveEventResponse[]> {
        return this.findAllPaged(undefined, "/past");
    }

    public async subscribeUserToEvent(eventSubscribeRequest: EventSubscribeRequest): Promise<DiveEventResponse> {
        const response = await this.axiosInstance.put<DiveEventResponse>("/subscribe", eventSubscribeRequest);
        return response.data;
    }

    public async unsubscribeUserToEvent(diveEventId: number): Promise<DiveEventResponse> {
        const response = await this.axiosInstance.delete<DiveEventResponse>("/" + diveEventId + "/unsubscribe");
        return response.data;
    }

    public async joinWaitingList(diveEventId: number): Promise<DiveEventResponse> {
        const response = await this.axiosInstance.post<DiveEventResponse>("/" + diveEventId + "/waiting-list/join");
        return response.data;
    }

    public async leaveWaitingList(diveEventId: number): Promise<DiveEventResponse> {
        const response = await this.axiosInstance.post<DiveEventResponse>("/" + diveEventId + "/waiting-list/leave");
        return response.data;
    }

    public async getDiveEventDives(diveEventId: number): Promise<DiveEventListResponse> {
        const response = await this.axiosInstance.get<DiveEventListResponse>("/" + diveEventId + "/dives");
        return response.data;
    }

    public async updateDiveEventDives(diveEventId: number, diveEventDives: DiveEventListRequest): Promise<DiveEventListResponse> {
        const response = await this.axiosInstance.put<DiveEventListResponse>("/" + diveEventId + "/dives", diveEventDives);
        return response.data;
    }
}

export const diveEventAPI = new DiveEventAPI("/events");
