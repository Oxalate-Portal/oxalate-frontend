import {AuditLevelEnum} from "../AuditLevelEnum";
import type {Dayjs} from "dayjs";

export interface AuditEntryResponse {
    id: number;
    trace_id: string;
    source: string;
    level: AuditLevelEnum;
    user_id: number;
    user_name: string;
    address: string;
    message: string;
    created_at: Dayjs;
}
