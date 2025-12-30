export const PaymentTypeEnum = {
    PERIODICAL: "PERIODICAL",
    ONE_TIME: "ONE_TIME",
    DISABLED: "DISABLED",
    NONE: "NONE"
} as const;

export type PaymentTypeEnum = typeof PaymentTypeEnum[keyof typeof PaymentTypeEnum];
