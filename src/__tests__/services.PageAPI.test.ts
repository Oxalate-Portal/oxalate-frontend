/// <reference types="jest" />
import {pageAPI} from "../services";
import MockAdapter from "axios-mock-adapter";
import type {PagedRequest, PageRequest} from "../models";

describe("PageAPI", () => {
    let mock: MockAdapter;

    beforeEach(() => {
        mock = new MockAdapter(pageAPI["axiosInstance"]);
    });

    afterEach(() => {
        mock.reset();
    });

    it("should get navigation items by language", async () => {
        const language = "en";
        const mockResponse = [{id: 1, name: "Home", language}];
        mock.onGet(`/navigation-elements?language=${language}`).reply(200, mockResponse);

        const result = await pageAPI.getNavigationItems(language);
        expect(result).toEqual(mockResponse);
    });

    it("should handle empty navigation items response", async () => {
        const language = "en";
        mock.onGet(`/navigation-elements?language=${language}`).reply(200, []);

        const result = await pageAPI.getNavigationItems(language);
        expect(result).toBeUndefined();
    });

    it("should get paged blogs with the language and paging as query parameters", async () => {
        const pagedRequest: PagedRequest = {page: 0, size: 10, sort_by: "created_at", direction: "DESC", search: "dive", case_sensitive: true};
        const mockResponse = {
            content: [{id: 1, title: "Blog 1", created_at: "2026-01-01T10:00:00Z"}],
            page: 0,
            size: 10,
            total_elements: 1,
            total_pages: 1,
            first: true,
            last: true,
            empty: false
        };
        mock.onGet("/blogs").reply(200, mockResponse);

        const result = await pageAPI.getPagedBlogs(pagedRequest, "fi");

        expect(mock.history.get[0]?.params).toEqual({
            page: 0,
            size: 10,
            sort_by: "created_at",
            direction: "DESC",
            search: "dive",
            case_sensitive: true,
            language: "fi"
        });
        expect(mock.history.post).toHaveLength(0);
        expect(result.total_elements).toBe(1);
        expect(result.content[0]).toEqual(expect.objectContaining({id: 1, title: "Blog 1"}));
    });

    it("should find all pages", async () => {
        const mockResponse = [{id: 1, title: "Page 1"}, {id: 2, title: "Page 2"}];
        mock.onGet("").reply(200, mockResponse);

        const result = await pageAPI.findAll();
        expect(result).toEqual(mockResponse);
    });

    it("should find page by id", async () => {
        const mockResponse = {id: 1, title: "Page 1"};
        mock.onGet("/1").reply(200, mockResponse);

        const result = await pageAPI.findById(1, null);
        expect(result).toEqual(mockResponse);
    });

    it("should create page", async () => {
        const payload = {title: "New Page"} as unknown as PageRequest;
        const mockResponse = {id: 1, title: "New Page"};
        mock.onPost("", payload).reply(200, mockResponse);

        const result = await pageAPI.create(payload);
        expect(result).toEqual(mockResponse);
    });

    it("should update page", async () => {
        const payload = {id: 1, title: "Updated Page"} as unknown as PageRequest;
        const mockResponse = {id: 1, title: "Updated Page"};
        mock.onPut("", payload).reply(200, mockResponse);

        const result = await pageAPI.update(payload);
        expect(result).toEqual(mockResponse);
    });

    it("should delete page", async () => {
        mock.onDelete("/1").reply(204);
        await pageAPI.delete(1);
        expect(mock.history.delete).toHaveLength(1);
    });
});

