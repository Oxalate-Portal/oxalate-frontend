export interface TokenResponse {
    tokenId: number;
    tokenValue?: string | null;
    createdAt: string | Date;
    expiresAt: string | Date;
    description?: string | null;
}
