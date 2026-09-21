/**
 * The page envelope returned by every server-paged list endpoint. `page` is 0-based.
 */
export interface PagedResponse<T> {
    content: T[];
    page: number;
    size: number;
    total_elements: number;
    total_pages: number;
    first: boolean;
    last: boolean;
    empty: boolean;
}
