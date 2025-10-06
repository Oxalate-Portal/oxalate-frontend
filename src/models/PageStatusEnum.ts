export const PageStatusEnum = {
    DRAFTED: 'DRAFTED',
    PUBLISHED: 'PUBLISHED',
    DELETED: 'DELETED'
} as const;

export type PageStatusEnum = typeof PageStatusEnum[keyof typeof PageStatusEnum];
