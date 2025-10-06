export const ResultEnum = {
    OK: "OK",
    FAIL: "FAIL"
} as const;

export type ResultEnum = typeof ResultEnum[keyof typeof ResultEnum];
