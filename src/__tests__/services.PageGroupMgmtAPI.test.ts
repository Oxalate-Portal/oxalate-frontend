/// <reference types="jest" />
import {pageGroupMgmtAPI} from "../services";
import MockAdapter from "axios-mock-adapter";
import type {PageGroupRequest} from "../models";

describe("PageGroupMgmtAPI", () => {
    let mock: MockAdapter;

    beforeEach(() => {
        mock = new MockAdapter(pageGroupMgmtAPI["axiosInstance"]);
    });

    afterEach(() => {
        mock.reset();
    });

    it("should find all page groups", async () => {
        const mockResponse = [{id: 1, name: "Group1"}, {id: 2, name: "Group2"}];
        mock.onGet("").reply(200, mockResponse);

        const result = await pageGroupMgmtAPI.findAll();
        expect(result).toEqual(mockResponse);
    });

    it("should find page group by id", async () => {
        const mockResponse = {id: 1, name: "Group1"};
        mock.onGet("/1").reply(200, mockResponse);

        const result = await pageGroupMgmtAPI.findById(1, null);
        expect(result).toEqual(mockResponse);
    });

    it("should create page group", async () => {
        const payload = {name: "New Group"} as unknown as PageGroupRequest;
        const mockResponse = {id: 1, name: "New Group"};
        mock.onPost("", payload).reply(200, mockResponse);

        const result = await pageGroupMgmtAPI.create(payload);
        expect(result).toEqual(mockResponse);
    });

    it("should update page group", async () => {
        const payload = {id: 1, name: "Updated Group"} as unknown as PageGroupRequest;
        const mockResponse = {id: 1, name: "Updated Group"};
        mock.onPut("", payload).reply(200, mockResponse);

        const result = await pageGroupMgmtAPI.update(payload);
        expect(result).toEqual(mockResponse);
    });

    it("should delete page group", async () => {
        mock.onDelete("/1").reply(204);
        await pageGroupMgmtAPI.delete(1);
        expect(mock.history.delete).toHaveLength(1);
    });

    it("should find pageable page groups", async () => {
        const mockResponse = {
            content: [{id: 1, name: "Group1"}],
            page: 0,
            size: 10,
            total_elements: 1,
            total_pages: 1,
            first: true,
            last: true,
            empty: false
        };
        mock.onPost("").reply(200, mockResponse);

        const result = await pageGroupMgmtAPI.findPaged({page: 0, size: 10});
        expect(JSON.parse(mock.history.post[0]?.data)).toEqual({page: 0, size: 10});
        expect(result).toEqual(mockResponse);
    });
});
