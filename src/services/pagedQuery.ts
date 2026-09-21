import type {PagedRequest} from "../models";

/** The largest page the backend serves (`PagingTools.MAX_PAGE_SIZE`); larger requests are capped server-side. */
export const MAX_PAGE_SIZE = 200;

export type PagedQueryExtraParams = Record<string, string | number | boolean | undefined>;

/**
 * Turns optional endpoint-specific parameters into query parameters. Paged request fields are sent in the POST body.
 */
export function toPagedQueryParams(request: Partial<PagedRequest>, extraParams?: PagedQueryExtraParams): Record<string, string | number | boolean> {
    const merged: PagedQueryExtraParams = {
        ...request,
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
