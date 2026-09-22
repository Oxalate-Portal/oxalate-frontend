import {EmailNotificationTypeEnum} from "../EmailNotificationTypeEnum";

export interface EmailNotificationSubscriptionRequest {
    subscription_list: EmailNotificationTypeEnum[];
}
