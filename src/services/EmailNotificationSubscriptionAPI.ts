import Axios, {type AxiosInstance} from "axios";
import type {EmailNotificationSubscriptionRequest, EmailNotificationSubscriptionResponse} from "../models";
import {getApiBaseUrl} from "./getApiBaseUrl";

class EmailNotificationSubscriptionAPI {
    protected axiosInstance: AxiosInstance;

    constructor(member: string) {
        this.axiosInstance = Axios.create({
            baseURL: getApiBaseUrl() + member,
            withCredentials: true,
            headers: {"Content-Type": "application/json;charset=utf-8"}
        });
    }

    public async getUserEmailSubscriptions(): Promise<EmailNotificationSubscriptionResponse[]> {
        const response = await this.axiosInstance.get<EmailNotificationSubscriptionResponse[]>("");
        return response.data;
    }

    public async subscribeToEmailNotification(payload: EmailNotificationSubscriptionRequest): Promise<EmailNotificationSubscriptionResponse[]> {
        const response = await this.axiosInstance.post<EmailNotificationSubscriptionResponse[]>("", payload);
        return response.data;
    }
}

export const emailNotificationSubscriptionAPI = new EmailNotificationSubscriptionAPI("/email-notification-subscriptions")