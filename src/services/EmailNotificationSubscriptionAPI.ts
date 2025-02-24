import Axios, {AxiosInstance} from "axios";
import {EmailNotificationSubscriptionRequest} from "../models/requests";
import {EmailNotificationSubscriptionResponse} from "../models/responses";

class EmailNotificationSubscriptionAPI {
    protected axiosInstance: AxiosInstance;

    constructor(member: string) {
        this.axiosInstance = Axios.create({
            baseURL: `${import.meta.env.VITE_APP_API_URL}` + member,
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