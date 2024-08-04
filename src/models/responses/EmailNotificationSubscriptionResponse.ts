import {EmailNotificationTypeEnum} from "../EmailNotificationTypeEnum";

export interface EmailNotificationSubscriptionResponse {
    id: number;
    emailNotificationType: EmailNotificationTypeEnum;
    userId: number;
}