import {AuditLevelEnum} from "../AuditLevelEnum";
import type {Dayjs} from "dayjs";

export interface AuditEntryResponse {
    id: number;
    traceId: string;
    source: string;
    level: AuditLevelEnum;
    userId: number;
    userName: string;
    address: string;
    message: string;
    createdAt: Dayjs;
}