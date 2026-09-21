export interface TokenListRequest {
    page: number;
    size: number;
    value?: string;
    date_from?: string;
    date_to?: string;
    description?: string;
}
