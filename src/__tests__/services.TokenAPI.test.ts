/// <reference types="jest" />
import MockAdapter from "axios-mock-adapter";
import {tokenAPI} from "../services";

describe("TokenAPI", () => {
    let mock: MockAdapter;

    beforeEach(() => {
        mock = new MockAdapter(tokenAPI["axiosInstance"]);
    });

    afterEach(() => {
        mock.reset();
    });

    it("lists tokens and creates a token", async () => {
        const token = {tokenId: 1, tokenValue: "a".repeat(64), createdAt: "2026-01-01T00:00:00Z", expiresAt: "2027-01-01T00:00:00Z"};
        mock.onGet("").reply(200, [token]);
        mock.onPost("").reply(201, token);

        await expect(tokenAPI.list()).resolves.toEqual([expect.objectContaining({tokenId: 1})]);
        await expect(tokenAPI.createToken({expiresAt: token.expiresAt})).resolves.toEqual(expect.objectContaining({tokenValue: token.tokenValue}));
    });

    it("refreshes and invalidates a token by value", async () => {
        const token = {tokenId: 1, tokenValue: "new-token", createdAt: "2026-01-01T00:00:00Z", expiresAt: "2027-01-01T00:00:00Z"};
        mock.onPost("/refresh", {tokenValue: "old-token", days: 30}).reply(200, token);
        mock.onDelete("", {data: {tokenValue: "old-token"}}).reply(204);

        await expect(tokenAPI.refreshToken({tokenValue: "old-token", days: 30})).resolves.toEqual(expect.objectContaining({tokenValue: "new-token"}));
        await expect(tokenAPI.invalidateToken("old-token")).resolves.toBe(true);
    });

    it("supports legacy aliases and reports unsuccessful invalidation responses", async () => {
        const token = {tokenId: 2, tokenValue: "alias-token", createdAt: "2026-01-01T00:00:00Z", expiresAt: "2027-01-01T00:00:00Z"};
        mock.onGet("").reply(200, [token]);
        mock.onPost("/refresh", {tokenValue: "alias-token", days: 7}).reply(200, token);

        await expect(tokenAPI.getTokens()).resolves.toEqual([expect.objectContaining({tokenId: 2})]);
        await expect(tokenAPI.refresh({tokenValue: "alias-token", days: 7})).resolves.toEqual(expect.objectContaining({tokenValue: "alias-token"}));
        jest.spyOn(tokenAPI["axiosInstance"], "delete").mockResolvedValue({status: 400} as never);
        await expect(tokenAPI.invalidate("alias-token")).resolves.toBe(false);
    });
});
