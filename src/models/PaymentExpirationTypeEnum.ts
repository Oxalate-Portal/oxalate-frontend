export const PaymentExpirationTypeEnum = {
    DISABLED: "disabled",
    PERPETUAL: "perpetual",
    PERIODICAL: "periodical",
    DURATIONAL: "durational"
} as const;

export type PaymentExpirationTypeEnum = typeof PaymentExpirationTypeEnum[keyof typeof PaymentExpirationTypeEnum];

