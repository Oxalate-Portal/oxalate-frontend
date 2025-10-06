export const DiveEventStatusEnum = {
    DRAFTED: 'DRAFTED',
    PUBLISHED: 'PUBLISHED',
    HELD: 'HELD',
    CANCELLED: 'CANCELLED'
} as const;

export type DiveEventStatusEnum = typeof DiveEventStatusEnum[keyof typeof DiveEventStatusEnum];

