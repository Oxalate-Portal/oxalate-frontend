/// <reference types="jest" />
import {membershipAPI} from "../services";
import MockAdapter from "axios-mock-adapter";
import type {MembershipRequest} from "../models";

describe("MembershipAPI", () => {
    let mock: MockAdapter;

    beforeEach(() => {
        mock = new MockAdapter(membershipAPI["axiosInstance"]);
    });

    afterEach(() => {
        mock.reset();
    });

    it("should find memberships by user id", async () => {
        const userId = 1;
        const mockResponse = [{id: 1, userId, type: "ACTIVE"}];
        mock.onGet(`/user/${userId}`).reply(200, mockResponse);

        const result = await membershipAPI.findByUserId(userId);
        expect(result).toEqual(mockResponse);
    });

    it("should find membership by membership id", async () => {
        const membershipId = 1;
        const mockResponse = {id: membershipId, type: "ACTIVE"};
        mock.onGet(`/${membershipId}`).reply(200, mockResponse);

        const result = await membershipAPI.findByMemberId(membershipId);
        expect(result).toEqual(mockResponse);
    });

    it("should collect all memberships through the pages", async () => {
        mock.onPost("/paged").reply(200, {
            content: [{id: 1, type: "ACTIVE"}, {id: 2, type: "EXPIRED"}],
            page: 0, size: 200, total_elements: 2, total_pages: 1, first: true, last: true, empty: false
        });

        const result = await membershipAPI.findAll();
        expect(result).toEqual([{id: 1, type: "ACTIVE"}, {id: 2, type: "EXPIRED"}]);
        expect(JSON.parse(mock.history.post[0]?.data)).toEqual({page: 0, size: 200});
    });

    it("should find a page of memberships sorted and searched on the server", async () => {
        const mockResponse = {
            content: [{
                id: 1,
                user_id: 2,
                username: "Ada",
                status: "ACTIVE",
                type: "PERIODICAL",
                start_date: "2026-01-01",
                end_date: "2026-12-31",
                created: "2026-01-01T10:00:00Z"
            }],
            page: 0, size: 10, total_elements: 1, total_pages: 1, first: true, last: true, empty: false
        };
        mock.onPost("/paged").reply(200, mockResponse);

        const result = await membershipAPI.findPaged({page: 0, size: 10, sort_by: "username", direction: "ASC", search: "ada", case_sensitive: true});

        expect(JSON.parse(mock.history.post[0]?.data)).toEqual({page: 0, size: 10, sort_by: "username", direction: "ASC", search: "ada", case_sensitive: true});
        expect(result.total_elements).toBe(1);
        expect(result.content[0]).toEqual(expect.objectContaining({id: 1, username: "Ada"}));
    });

    it("should create membership", async () => {
        const payload = {
            id: 0,
            user_id: 214,
            status: "ACTIVE",
            type: "PERIODICAL",
            start_date: "2026-01-01",
            end_date: "2027-01-01"
        } as MembershipRequest;
        const mockResponse = {id: 1, user_id: 1, type: "ACTIVE"};
        mock.onPost("", payload).reply(200, mockResponse);

        const result = await membershipAPI.create(payload);
        expect(result).toEqual(mockResponse);
        expect(JSON.parse(mock.history.post[0]?.data)).toEqual(payload);
        expect(mock.history.post[0]?.data).not.toContain("T00:00:00");
    });

    it("should update membership", async () => {
        const payload = {id: 1, type: "EXPIRED"} as unknown as MembershipRequest;
        const mockResponse = {id: 1, type: "EXPIRED"};
        mock.onPut("", payload).reply(200, mockResponse);

        const result = await membershipAPI.update(payload);
        expect(result).toEqual(mockResponse);
    });

    it("should delete membership", async () => {
        mock.onDelete("/1").reply(204);
        await membershipAPI.delete(1);
        expect(mock.history.delete).toHaveLength(1);
    });
});
