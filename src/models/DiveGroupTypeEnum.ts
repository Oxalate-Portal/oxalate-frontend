export const DiveGroupTypeEnum = {
    NORMAL: "NORMAL",
    PROJECT: "PROJECT"
} as const;

export type DiveGroupTypeEnum = typeof DiveGroupTypeEnum[keyof typeof DiveGroupTypeEnum];
