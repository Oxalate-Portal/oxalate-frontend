import type {SortDirectionEnum} from "../SortDirectionEnum.ts";

/**
 * Paging, sorting and search parameters of the server-paged GET list endpoints. The fields are sent as query
 * parameters with these exact names; `page` is 0-based and `size` is capped by the backend at 200.
 */
export interface PagedRequest {
    page: number;
    size: number;
    sort_by?: string;
    direction?: SortDirectionEnum;
    search?: string;
    case_sensitive?: boolean;
}
