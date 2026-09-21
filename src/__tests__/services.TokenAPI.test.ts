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

    const page = (tokens: object[]) => ({
        content: tokens,
        page: 0,
        size: 25,
        total_elements: tokens.length,
        total_pages: 1,
        first: true,
        last: true,
        empty: tokens.length === 0
    });

    it("lists a page of tokens with the query parameters and creates a token", async () => {
        const token = {token_id: 1, token_value: "a".repeat(64), created_at: "2026-01-01T00:00:00Z", expires_at: "2027-01-01T00:00:00Z"};
        mock.onGet("").reply(200, page([token]));
        mock.onPost("").reply(201, token);

        const result = await tokenAPI.list({page: 0, size: 25, sort_by: "created_at", direction: "DESC", search: "deploy", case_sensitive: false});
        expect(mock.history.get[0]?.params).toEqual({page: 0, size: 25, sort_by: "created_at", direction: "DESC", search: "deploy", case_sensitive: false});
        expect(result.total_elements).toBe(1);
        expect(result.content).toEqual([expect.objectContaining({token_id: 1})]);
        await expect(tokenAPI.createToken({expires_at: token.expires_at})).resolves.toEqual(expect.objectContaining({token_value: token.token_value}));
    });

    it("refreshes and invalidates a token by value", async () => {
        const token = {token_id: 1, token_value: "new-token", created_at: "2026-01-01T00:00:00Z", expires_at: "2027-01-01T00:00:00Z"};
        mock.onPost("/refresh", {token_value: "old-token", days: 30}).reply(200, token);
        mock.onDelete("", {data: {token_value: "old-token"}}).reply(204);

        await expect(tokenAPI.refreshToken({token_value: "old-token", days: 30})).resolves.toEqual(expect.objectContaining({token_value: "new-token"}));
        await expect(tokenAPI.invalidateToken("old-token")).resolves.toBe(true);
    });

    it("supports legacy aliases and reports unsuccessful invalidation responses", async () => {
        const token = {token_id: 2, token_value: "alias-token", created_at: "2026-01-01T00:00:00Z", expires_at: "2027-01-01T00:00:00Z"};
        mock.onGet("").reply(200, page([token]));
        mock.onPost("/refresh", {token_value: "alias-token", days: 7}).reply(200, token);

        await expect(tokenAPI.getTokens({page: 0, size: 25})).resolves.toEqual(expect.objectContaining({content: [expect.objectContaining({token_id: 2})]}));
        await expect(tokenAPI.findAll()).resolves.toEqual([expect.objectContaining({token_id: 2})]);
        await expect(tokenAPI.refresh({token_value: "alias-token", days: 7})).resolves.toEqual(expect.objectContaining({token_value: "alias-token"}));
        jest.spyOn(tokenAPI["axiosInstance"], "delete").mockResolvedValue({status: 400} as never);
        await expect(tokenAPI.invalidate("alias-token")).resolves.toBe(false);
    });
});
