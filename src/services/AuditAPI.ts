import {AbstractAPI} from "./AbstractAPI";
import {AuditEntryResponse, PageableResponse} from "../models/responses";

class AuditAPI extends AbstractAPI<PageableResponse<AuditEntryResponse>> {

}

export const auditAPI = new AuditAPI("/audits");