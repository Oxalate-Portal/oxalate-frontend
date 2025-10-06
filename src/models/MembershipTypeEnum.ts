export const MembershipTypeEnum = {
    DISABLED: "DISABLED",
    PERPETUAL: "PERPETUAL",
    PERIODICAL: "PERIODICAL",
    DURATIONAL: "DURATIONAL"
} as const;

export type MembershipTypeEnum = typeof MembershipTypeEnum[keyof typeof MembershipTypeEnum];

