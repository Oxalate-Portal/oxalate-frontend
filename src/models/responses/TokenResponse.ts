export interface TokenResponse {
    token_id: number;
    token_value?: string | null;
    created_at: string | Date;
    expires_at: string | Date;
    description?: string | null;
}
