export const PortalConfigGroupEnum = {
    COMMENTING: "commenting",
    EMAIL: "email",
    GENERAL: "general",
    FRONTEND: "frontend",
    FILES: "files",
    MEMBERSHIP: "membership",
    PAYMENT: "payment"
} as const;

export type PortalConfigGroupEnum = typeof PortalConfigGroupEnum[keyof typeof PortalConfigGroupEnum];

