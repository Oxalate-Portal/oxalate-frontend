export const EmailNotificationTypeEnum = {
    EVENT: 'EVENT',
    PAGE: 'PAGE'
} as const;

export type EmailNotificationTypeEnum = typeof EmailNotificationTypeEnum[keyof typeof EmailNotificationTypeEnum];

