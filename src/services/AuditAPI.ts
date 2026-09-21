import {AbstractAPI} from "./AbstractAPI";
import type {AuditEntryResponse, PagedRequest, PagedResponse} from "../models";

/** The columns the `/audits` endpoint can restrict the free-text search to. */
export type AuditFilterColumn = "user_name" | "trace_id" | "source" | "address" | "message";

/**
 * This class is used to make API calls to the /audits endpoint. We only retrieve data from this endpoint so there is no request payload.
 */
class AuditAPI extends AbstractAPI<void, AuditEntryResponse> {
    public override async findAll(params?: Record<string, string | number>): Promise<AuditEntryResponse[]> {
        return this.findAllPaged(params);
    }

    /**
     * Fetches one page of the audit trail. `request.search` is matched against the given column only.
     */
    public async findPagedAudits(request: PagedRequest, filterColumn?: AuditFilterColumn): Promise<PagedResponse<AuditEntryResponse>> {
        return this.findPaged(request, {filter_column: filterColumn});
    }

    /**
     * Fetches one page of the audit entries of a single user.
     */
    public async findPagedByUserId(userId: number, request: PagedRequest): Promise<PagedResponse<AuditEntryResponse>> {
        return this.findPaged(request, undefined, "/" + userId);
    }
}

export const auditAPI = new AuditAPI("/audits");
