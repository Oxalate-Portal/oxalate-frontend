export const MembershipStatusEnum = {
    ACTIVE: "ACTIVE",
    EXPIRED: "EXPIRED",
    CANCELLED: "CANCELLED"
} as const;

export type MembershipStatusEnum = typeof MembershipStatusEnum[keyof typeof MembershipStatusEnum];

