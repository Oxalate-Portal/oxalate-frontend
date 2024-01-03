import {AuditLevelEnum} from "../AuditLevelEnum";

export interface AuditEntryResponse {
    id: number;
    traceId: string;
    source: string;
    level: AuditLevelEnum;
    userId: number;
    userName: string;
    address: string;
    message: string;
    createdAt: Date;
}