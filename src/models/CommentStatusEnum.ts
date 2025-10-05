export const CommentStatusEnum = {
    DRAFTED: "DRAFTED",
    HELD_FOR_MODERATION: "HELD_FOR_MODERATION",
    PUBLISHED: "PUBLISHED",
    REJECTED: "REJECTED",
    CANCELLED: "CANCELLED"
} as const;

export type CommentStatusEnum = typeof CommentStatusEnum[keyof typeof CommentStatusEnum];

