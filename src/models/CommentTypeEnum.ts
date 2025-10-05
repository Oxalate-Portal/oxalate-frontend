export const CommentTypeEnum = {
    TOPIC: "TOPIC",
    USER_COMMENT: "USER_COMMENT"
} as const;

export type CommentTypeEnum = typeof CommentTypeEnum[keyof typeof CommentTypeEnum];

