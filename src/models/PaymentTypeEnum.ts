export const PaymentTypeEnum = {
    PERIOD: "PERIOD",
    ONE_TIME: "ONE_TIME",
    NONE: "NONE"
} as const;

export type PaymentTypeEnum = typeof PaymentTypeEnum[keyof typeof PaymentTypeEnum];
