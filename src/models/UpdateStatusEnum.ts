export const UpdateStatusEnum = {
    NONE: 'NONE',
    OK: 'OK',
    FAIL: 'FAIL'
} as const;

export type UpdateStatusEnum = typeof UpdateStatusEnum[keyof typeof UpdateStatusEnum];
