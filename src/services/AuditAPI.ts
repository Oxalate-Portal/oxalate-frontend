import {AbstractAPI} from "./AbstractAPI";
import {AuditEntryResponse} from "../models/responses";

class AuditAPI extends AbstractAPI<AuditEntryResponse> {
}

export const auditAPI = new AuditAPI("/audits");