export interface PagedResponse<T> {
    content: T[];

    // Legacy snake_case fields
    page?: number;
    size: number;
    total_elements?: number;
    total_pages?: number;

    // Spring Data camelCase fields
    number?: number;
    totalElements?: number;
    totalPages?: number;
    pageable?: {
        pageNumber?: number;
        pageSize?: number;
    };

    first: boolean;
    last: boolean;
    empty: boolean;
}