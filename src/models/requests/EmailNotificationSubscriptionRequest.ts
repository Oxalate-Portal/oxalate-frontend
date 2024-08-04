import {EmailNotificationTypeEnum} from "../EmailNotificationTypeEnum";

export interface EmailNotificationSubscriptionRequest {
    subscriptionList: EmailNotificationTypeEnum[];
}