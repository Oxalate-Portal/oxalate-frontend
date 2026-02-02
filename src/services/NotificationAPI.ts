import {AbstractAPI} from "./AbstractAPI";
import type {ActionResponse, MarkReadRequest, MessageRequest, MessageResponse} from "../models";

class NotificationAPI extends AbstractAPI<MessageRequest, MessageResponse> {

    public async getUnreadNotifications(): Promise<MessageResponse[]> {
        const response = await this.axiosInstance.get<MessageResponse[]>("/unread");
        return response.data;
    }

    public async getAllNotifications(): Promise<MessageResponse[]> {
        const response = await this.axiosInstance.get<MessageResponse[]>("/all");
        return response.data;
    }

    public async markNotificationsAsRead(markReadRequest: MarkReadRequest): Promise<ActionResponse> {
        const response = await this.axiosInstance.post<ActionResponse>("/mark-read", markReadRequest);
        return response.data;
    }

    public async createNotification(messageRequest: MessageRequest): Promise<MessageResponse> {
        const response = await this.axiosInstance.post<MessageResponse>("/create", messageRequest);
        return response.data;
    }

    public async createBulkNotifications(messageRequest: MessageRequest): Promise<ActionResponse> {
        const response = await this.axiosInstance.post<ActionResponse>("/create-bulk", messageRequest);
        return response.data;
    }
}

export const notificationAPI = new NotificationAPI("/notifications");
