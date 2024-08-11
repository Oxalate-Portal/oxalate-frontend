import {SessionVO} from "../models";
import Axios, {AxiosInstance} from "axios";
import {EmailNotificationSubscriptionRequest} from "../models/requests";
import {EmailNotificationSubscriptionResponse} from "../models/responses";

class EmailNotificationSubscriptionAPI {
    protected axiosInstance: AxiosInstance;

    constructor(member: string) {
        this.axiosInstance = Axios.create({
            baseURL: `${import.meta.env.VITE_APP_API_URL}` + member
        });
    }

    public async getUserEmailSubscriptions(): Promise<EmailNotificationSubscriptionResponse[]> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.put['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.get<EmailNotificationSubscriptionResponse[]>("");
        return response.data;
    }

    public async subscribeToEmailNotification(payload: EmailNotificationSubscriptionRequest): Promise<EmailNotificationSubscriptionResponse[]> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.put['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.post<EmailNotificationSubscriptionResponse[]>("", payload);
        return response.data;
    }

    /**
     * Sets the authorization header for the axios instance. We get the authorization bearer value from the local storage. We're forced
     * to do this on every request because the token can expire at any time. Copied from AbstractAPI.ts
     * @private
     */

    private setAuthorizationHeader(): void {
        const session: SessionVO = JSON.parse(localStorage.getItem("user") || "{}");

        if (session && session.accessToken) {
            this.axiosInstance.defaults.headers.common['Authorization'] = 'Bearer ' + session.accessToken;
        }
    }
}

export const emailNotificationSubscriptionAPI = new EmailNotificationSubscriptionAPI("/email-notification-subscriptions")