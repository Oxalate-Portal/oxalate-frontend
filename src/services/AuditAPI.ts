import {AbstractAPI} from "./AbstractAPI";
import {AuditEntryResponse} from "../models/responses";

/**
 * This class is used to make API calls to the /audits endpoint. We only retrieve data from this endpoint so there is no request payload.
 */
class AuditAPI extends AbstractAPI<void, AuditEntryResponse> {
}

export const auditAPI = new AuditAPI("/audits");