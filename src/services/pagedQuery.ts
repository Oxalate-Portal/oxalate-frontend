import type {PagedRequest} from "../models";

/** The largest page the backend serves (`PagingTools.MAX_PAGE_SIZE`); larger requests are capped server-side. */
export const MAX_PAGE_SIZE = 200;

export type PagedQueryExtraParams = Record<string, string | number | boolean | undefined>;

/**
 * Turns a {@link PagedRequest} plus optional endpoint-specific parameters into the query parameters of a server-paged
 * GET list endpoint. Undefined and empty values are omitted so the backend applies its own defaults.
 */
export function toPagedQueryParams(request: PagedRequest, extraParams?: PagedQueryExtraParams): Record<string, string | number | boolean> {
    const merged: PagedQueryExtraParams = {
        page: request.page,
        size: request.size,
        sort_by: request.sort_by,
        direction: request.direction,
        search: request.search,
        case_sensitive: request.case_sensitive,
        ...extraParams
    };
    const params: Record<string, string | number | boolean> = {};

    for (const [key, value] of Object.entries(merged)) {
        if (value === undefined || value === null || (typeof value === "string" && value.trim() === "")) {
            continue;
        }

        params[key] = value;
    }

    return params;
}
