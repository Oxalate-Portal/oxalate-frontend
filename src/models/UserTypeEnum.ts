export const UserTypeEnum = {
    NON_DIVER: "NON_DIVER",
    SCUBA_DIVER: "SCUBA_DIVER",
    FREE_DIVER: "FREE_DIVER",
    SNORKLER: "SNORKLER"
} as const;

export type UserTypeEnum = typeof UserTypeEnum[keyof typeof UserTypeEnum];

