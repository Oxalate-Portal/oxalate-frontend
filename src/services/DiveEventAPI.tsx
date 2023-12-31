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
}

export const diveEventAPI = new DiveEventAPI('/events');
