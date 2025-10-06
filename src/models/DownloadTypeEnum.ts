export const DownloadTypeEnum = {
    CERTIFICATE: "CERTIFICATE",
    DIVE: "DIVE",
    DIVE_EVENT: "DIVE_EVENT",
    MEMBER: "MEMBER",
    PAYMENT: "PAYMENT"
} as const;

export type DownloadTypeEnum = (typeof DownloadTypeEnum)[keyof typeof DownloadTypeEnum];