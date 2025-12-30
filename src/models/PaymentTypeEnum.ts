export const PaymentTypeEnum = {
    PERIOD: "PERIOD",
    ONE_TIME: "ONE_TIME",
    DISABLED: "DISABLED"
} as const;

export type PaymentTypeEnum = typeof PaymentTypeEnum[keyof typeof PaymentTypeEnum];
