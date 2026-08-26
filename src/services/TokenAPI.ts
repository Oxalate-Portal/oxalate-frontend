import {AbstractAPI} from "./AbstractAPI";
import type {TokenCreateRequest, TokenRefreshRequest, TokenResponse} from "../models";

class TokenAPI extends AbstractAPI<TokenCreateRequest, TokenResponse> {
    async list(): Promise<TokenResponse[]> {
        const response = await this.axiosInstance.get<TokenResponse[]>("");
        return response.data.map(token => this.transformResponse(token));
    }

    getTokens(): Promise<TokenResponse[]> {
        return this.list();
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
        const response = await this.axiosInstance.delete("", {data: {tokenValue}});
        return response.status >= 200 && response.status < 300;
    }

    invalidate(tokenValue: string): Promise<boolean> {
        return this.invalidateToken(tokenValue);
    }
}

export const tokenAPI = new TokenAPI("/tokens");
