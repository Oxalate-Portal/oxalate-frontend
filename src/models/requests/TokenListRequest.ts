export interface TokenListRequest {
    page: number;
    size: number;
    value?: string;
    dateFrom?: string;
    dateTo?: string;
    description?: string;
}
