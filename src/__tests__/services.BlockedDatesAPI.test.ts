/// <reference types="jest" />
import {blockedDatesAPI} from "../services";
import MockAdapter from "axios-mock-adapter";
import type {BlockedDateRequest} from "../models";

describe("BlockedDatesAPI", () => {
    let mock: MockAdapter;

    beforeEach(() => {
        mock = new MockAdapter(blockedDatesAPI["axiosInstance"]);
    });

    afterEach(() => {
        mock.reset();
    });

    it("should find all blocked dates", async () => {
        const mockResponse = [{id: 1, date: "2024-01-01"}, {id: 2, date: "2024-01-02"}];
        mock.onGet("").reply(200, mockResponse);

        const result = await blockedDatesAPI.findAll();
        expect(result).toEqual(mockResponse);
    });

    it("should find blocked date by id", async () => {
        const mockResponse = {id: 1, date: "2024-01-01"};
        mock.onGet("/1").reply(200, mockResponse);

        const result = await blockedDatesAPI.findById(1, null);
        expect(result).toEqual(mockResponse);
    });

    it("should create blocked date", async () => {
        const payload = {date: "2024-01-15"} as unknown as BlockedDateRequest;
        const mockResponse = {id: 1, date: "2024-01-15"};
        mock.onPost("", payload).reply(200, mockResponse);

        const result = await blockedDatesAPI.create(payload);
        expect(result).toEqual(mockResponse);
    });

    it("should update blocked date", async () => {
        const payload = {id: 1, date: "2024-01-20"} as unknown as BlockedDateRequest;
        const mockResponse = {id: 1, date: "2024-01-20"};
        mock.onPut("", payload).reply(200, mockResponse);

        const result = await blockedDatesAPI.update(payload);
        expect(result).toEqual(mockResponse);
    });

    it("should delete blocked date", async () => {
        mock.onDelete("/1").reply(204);
        await blockedDatesAPI.delete(1);
        expect(mock.history.delete).toHaveLength(1);
    });

    it("should find pageable blocked dates", async () => {
        const mockResponse = {
            content: [{id: 1, date: "2024-01-01"}],
            page: 0,
            size: 10,
            total_elements: 1,
            total_pages: 1,
            first: true,
            last: true,
            empty: false
        };
        mock.onGet("").reply(200, mockResponse);

        const result = await blockedDatesAPI.findPaged({page: 0, size: 10});
        expect(mock.history.get[0]?.params).toEqual({page: 0, size: 10});
        expect(result).toEqual(mockResponse);
    });
});

