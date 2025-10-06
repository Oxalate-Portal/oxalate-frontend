export const AuditLevelEnum = {
    ERROR: "ERROR",
    WARN: "WARN",
    INFO: "INFO"
} as const;

export type AuditLevelEnum = typeof AuditLevelEnum[keyof typeof AuditLevelEnum];

