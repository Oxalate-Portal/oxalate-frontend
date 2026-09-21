/// <reference types="jest" />
import {adminUserAPI} from "../services";
import MockAdapter from "axios-mock-adapter";
import type {AdminUserRequest} from "../models";

describe("AdminUserAPI", () => {
    let mock: MockAdapter;

    beforeEach(() => {
        mock = new MockAdapter(adminUserAPI["axiosInstance"]);
    });

    afterEach(() => {
        mock.reset();
    });

    it("should collect all admin users by walking through the pages", async () => {
        mock.onPost("").reply((config) => {
            const request = JSON.parse(config.data);
            const page = request.page;
            expect(request.size).toBe(200);
            return [200, {
                content: [{id: page + 1, email: `admin${page + 1}@example.com`}],
                page, size: 200, total_elements: 2, total_pages: 2, first: page === 0, last: page === 1, empty: false
            }];
        });

        const result = await adminUserAPI.findAll();
        expect(result).toEqual([{id: 1, email: "admin1@example.com"}, {id: 2, email: "admin2@example.com"}]);
        expect(mock.history.post).toHaveLength(2);
    });

    it("should find admin user by id", async () => {
        const mockResponse = {id: 1, email: "admin@example.com"};
        mock.onGet("/1").reply(200, mockResponse);

        const result = await adminUserAPI.findById(1, null);
        expect(result).toEqual(mockResponse);
    });

    it("should create admin user", async () => {
        const payload = {email: "newadmin@example.com"} as unknown as AdminUserRequest;
        const mockResponse = {id: 1, email: "newadmin@example.com"};
        mock.onPost("", payload).reply(200, mockResponse);

        const result = await adminUserAPI.create(payload);
        expect(result).toEqual(mockResponse);
    });

    it("should update admin user", async () => {
        const payload = {id: 1, email: "updated@example.com"} as unknown as AdminUserRequest;
        const mockResponse = {id: 1, email: "updated@example.com"};
        mock.onPut("", payload).reply(200, mockResponse);

        const result = await adminUserAPI.update(payload);
        expect(result).toEqual(mockResponse);
    });

    it("should delete admin user", async () => {
        mock.onDelete("/1").reply(204);
        await adminUserAPI.delete(1);
        expect(mock.history.delete).toHaveLength(1);
    });

    it("should find a sorted and searched page of admin users", async () => {
        const mockResponse = {
            content: [{id: 1, email: "admin@example.com", last_seen: "2026-01-01T10:00:00Z"}],
            page: 0, size: 10, total_elements: 1, total_pages: 1, first: true, last: true, empty: false
        };
        mock.onPost("").reply(200, mockResponse);

        const result = await adminUserAPI.findPaged({page: 0, size: 10, sort_by: "last_name", direction: "ASC", search: "ada", case_sensitive: false});
        expect(JSON.parse(mock.history.post[0]?.data)).toEqual({
            page: 0,
            size: 10,
            sort_by: "last_name",
            direction: "ASC",
            search: "ada",
            case_sensitive: false
        });
        expect(result.total_elements).toBe(1);
        expect(result.content[0]).toEqual(expect.objectContaining({id: 1}));
    });
});
