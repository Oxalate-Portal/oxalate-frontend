import {EmailNotificationTypeEnum} from "../EmailNotificationTypeEnum";

export interface EmailNotificationSubscriptionResponse {
    id: number;
    email_notification_type: EmailNotificationTypeEnum;
    user_id: number;
}
