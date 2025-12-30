export const PaymentExpirationTypeEnum = {
    DISABLED: "DISABLED",
    PERPETUAL: "PERPETUAL",
    PERIODICAL: "PERIODICAL",
    DURATIONAL: "DURATIONAL"
} as const;

export type PaymentExpirationTypeEnum = typeof PaymentExpirationTypeEnum[keyof typeof PaymentExpirationTypeEnum];

