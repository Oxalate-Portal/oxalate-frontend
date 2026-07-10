/**
 * Enumeration of user groups for notification targeting.
 * Used to send notifications to specific categories of users based on their activity, membership, or account status.
 */
export const NotificationGroupEnum = {
    ALL_REGISTERED: "all_registered",
    INACTIVE_DAYS: "inactive_days",
    ACTIVE_MEMBERSHIP: "active_membership",
    NO_ACTIVE_MEMBERSHIP: "no_active_membership",
    LOCKED_ACCOUNTS: "locked_accounts",
    NEVER_HAD_MEMBERSHIP: "never_had_membership"
} as const;

export type NotificationGroupEnum = typeof NotificationGroupEnum[keyof typeof NotificationGroupEnum];

export const NotificationGroupLabels: Record<NotificationGroupEnum, string> = {
    [NotificationGroupEnum.ALL_REGISTERED]: "AdminNotifications.groups.all_registered",
    [NotificationGroupEnum.INACTIVE_DAYS]: "AdminNotifications.groups.inactive_days",
    [NotificationGroupEnum.ACTIVE_MEMBERSHIP]: "AdminNotifications.groups.active_membership",
    [NotificationGroupEnum.NO_ACTIVE_MEMBERSHIP]: "AdminNotifications.groups.no_active_membership",
    [NotificationGroupEnum.LOCKED_ACCOUNTS]: "AdminNotifications.groups.locked_accounts",
    [NotificationGroupEnum.NEVER_HAD_MEMBERSHIP]: "AdminNotifications.groups.never_had_membership"
};
