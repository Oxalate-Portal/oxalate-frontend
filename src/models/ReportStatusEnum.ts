export const ReportStatusEnum = {
    PENDING: "PENDING",
    APPROVED: "APPROVED",
    CANCELLED: "CANCELLED",
    REJECTED: "REJECTED"
} as const;

export type ReportStatusEnum = typeof ReportStatusEnum[keyof typeof ReportStatusEnum];

