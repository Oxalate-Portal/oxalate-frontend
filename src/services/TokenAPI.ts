import {AbstractAPI} from "./AbstractAPI";
import type {PagedRequest, PagedResponse, TokenCreateRequest, TokenRefreshRequest, TokenResponse} from "../models";

class TokenAPI extends AbstractAPI<TokenCreateRequest, TokenResponse> {
    public override async findAll(params?: Record<string, string | number>): Promise<TokenResponse[]> {
        return this.findAllPaged(params, "/paged");
    }

    /**
     * Fetches one page of tokens; `request.search` matches the description and the token value.
     */
    async list(request: PagedRequest): Promise<PagedResponse<TokenResponse>> {
        return this.findPaged(request, undefined, "/paged");
    }

    getTokens(request: PagedRequest): Promise<PagedResponse<TokenResponse>> {
        return this.list(request);
    }

    async createToken(request: TokenCreateRequest): Promise<TokenResponse> {
        return this.create(request);
    }

    async refreshToken(request: TokenRefreshRequest): Promise<TokenResponse> {
        const response = await this.axiosInstance.post<TokenResponse>("/refresh", request);
        return this.transformResponse(response.data);
    }

    refresh(request: TokenRefreshRequest): Promise<TokenResponse> {
        return this.refreshToken(request);
    }

    async invalidateToken(tokenValue: string): Promise<boolean> {
        const response = await this.axiosInstance.delete("", {data: {token_value: tokenValue}});
        return response.status >= 200 && response.status < 300;
    }

    invalidate(tokenValue: string): Promise<boolean> {
        return this.invalidateToken(tokenValue);
    }
}

export const tokenAPI = new TokenAPI("/tokens");
