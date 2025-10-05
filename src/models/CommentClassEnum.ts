export const CommentClassEnum = {
    EVENT_COMMENTS: "EVENT_COMMENTS",
    PAGE_COMMENTS: "PAGE_COMMENTS",
    FORUM_COMMENTS: "FORUM_COMMENTS"
} as const;

export type CommentClassEnum = typeof CommentClassEnum[keyof typeof CommentClassEnum];

