export const UploadStatusEnum = {
    UPLOADED: "UPLOADED",
    PUBLISHED: "PUBLISHED",
    DELETED: "DELETED"
} as const;

export type UploadStatusEnum = typeof UploadStatusEnum[keyof typeof UploadStatusEnum];