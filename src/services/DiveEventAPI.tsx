import {AbstractAPI} from "./AbstractAPI";
import {DiveEventListItemResponse, DiveEventResponse} from "../models/responses";

class DiveEventAPI extends AbstractAPI<DiveEventResponse> {
    public async findByUserId(userId: number): Promise<DiveEventResponse[]> {
        this.setAuthorizationHeader();
        const response = await this.axiosInstance.get<DiveEventResponse[]>('/user/' + userId);
        return response.data;
    }

    public async findAllDiveEventListItems(): Promise<DiveEventListItemResponse[]> {
        this.setAuthorizationHeader();
        const response = await this.axiosInstance.get<DiveEventListItemResponse[]>('/');
        return response.data;
    }

    public async findAllDiveEventListItemsByUser(userId: number): Promise<DiveEventListItemResponse[]> {
        this.setAuthorizationHeader();
        const response = await this.axiosInstance.get<DiveEventListItemResponse[]>('/user/' + userId);
        return response.data;
    }

    public async findAllOngoingDiveEvents(): Promise<DiveEventResponse[]> {
        this.setAuthorizationHeader();
        const response = await this.axiosInstance.get<DiveEventResponse[]>('/ongoing');
        return response.data;
    }

    public async findAllPastDiveEvents(): Promise<DiveEventResponse[]> {
        this.setAuthorizationHeader();
        const response = await this.axiosInstance.get<DiveEventResponse[]>('/past');
        return response.data;
    }

    public async subscribeUserToEvent(diveEventId: number): Promise<DiveEventResponse> {
        this.setAuthorizationHeader();
        const response = await this.axiosInstance.put<DiveEventResponse>('/' + diveEventId + '/subscribe');
        return response.data;
    }

    public async unsubscribeUserToEvent(diveEventId: number): Promise<DiveEventResponse> {
        this.setAuthorizationHeader();
        const response = await this.axiosInstance.delete<DiveEventResponse>('/' + diveEventId + '/unsubscribe');
        return response.data;
    }
}

export const diveEventAPI = new DiveEventAPI('/events');