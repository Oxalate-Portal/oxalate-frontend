export const UserStatusEnum = {
    REGISTERED: "REGISTERED",
    ACTIVE: "ACTIVE",
    LOCKED: "LOCKED",
    ANONYMIZED: "ANONYMIZED"
} as const;

export type UserStatusEnum = typeof UserStatusEnum[keyof typeof UserStatusEnum];
