/// <reference types="jest" />
import {diveEventAPI} from "../services";
import MockAdapter from "axios-mock-adapter";
import type {DiveEventRequest, EventSubscribeRequest} from "../models";

describe("DiveEventAPI", () => {
    let mock: MockAdapter;

    beforeEach(() => {
        mock = new MockAdapter(diveEventAPI["axiosInstance"]);
    });

    afterEach(() => {
        mock.reset();
    });

    it("should find dive events by user id", async () => {
        const userId = 1;
        const mockResponse = [{id: 1, userId, title: "Event 1"}];
        mock.onGet(`/user/${userId}`).reply(200, mockResponse);

        const result = await diveEventAPI.findByUserId(userId);
        expect(result).toEqual(mockResponse);
    });

    it("should find all dive event list items", async () => {
        const mockResponse = [{id: 1, title: "Event 1"}];
        mock.onGet("/").reply(200, mockResponse);

        const result = await diveEventAPI.findAllDiveEventListItems();
        expect(result).toEqual(mockResponse);
    });

    it("should find all dive event list items by user", async () => {
        const userId = 1;
        const mockResponse = [{id: 1, userId, title: "Event 1"}];
        mock.onGet(`/user/${userId}`).reply(200, mockResponse);

        const result = await diveEventAPI.findAllDiveEventListItemsByUser(userId);
        expect(result).toEqual(mockResponse);
    });

    it("should find all ongoing dive events", async () => {
        const mockResponse = [{id: 1, status: "PUBLISHED", title: "Event 1"}];
        mock.onGet("/ongoing").reply(200, mockResponse);

        const result = await diveEventAPI.findAllOngoingDiveEvents();
        expect(result).toEqual(mockResponse);
    });

    it("should find a page of past dive events with a paging request body", async () => {
        const mockResponse = {
            content: [{id: 1, status: "HELD", title: "Event 1", start_time: "2026-01-01T10:00:00Z"}],
            page: 0, size: 10, total_elements: 1, total_pages: 1, first: true, last: true, empty: false
        };
        mock.onPost("/past").reply(200, mockResponse);

        const result = await diveEventAPI.findPastDiveEvents({
            page: 0,
            size: 10,
            sort_by: "start_time",
            direction: "DESC",
            search: "wreck",
            case_sensitive: false
        });

        expect(JSON.parse(mock.history.post[0]?.data)).toEqual({
            page: 0,
            size: 10,
            sort_by: "start_time",
            direction: "DESC",
            search: "wreck",
            case_sensitive: false
        });
        expect(result.total_elements).toBe(1);
        expect(result.content[0]).toEqual(expect.objectContaining({id: 1, title: "Event 1"}));
    });

    it("should collect all past dive events by walking through the pages", async () => {
        mock.onPost("/past").reply((config) => {
            const page = JSON.parse(config.data).page;
            return [200, {
                content: [{id: page + 1, status: "HELD", title: `Event ${page + 1}`}],
                page, size: 200, total_elements: 2, total_pages: 2, first: page === 0, last: page === 1, empty: false
            }];
        });

        const result = await diveEventAPI.findAllPastDiveEvents();
        expect(result.map((event) => event.id)).toEqual([1, 2]);
        expect(mock.history.post).toHaveLength(2);
    });

    it("should subscribe user to event", async () => {
        const subscribeRequest = {event_id: 1, user_id: 1} as unknown as EventSubscribeRequest;
        const mockResponse = {id: 1, status: "PUBLISHED"};
        mock.onPut("/subscribe", subscribeRequest).reply(200, mockResponse);

        const result = await diveEventAPI.subscribeUserToEvent(subscribeRequest);
        expect(result).toEqual(mockResponse);
    });

    it("should unsubscribe user from event", async () => {
        const eventId = 1;
        const mockResponse = {id: eventId, status: "PUBLISHED"};
        mock.onDelete(`/${eventId}/unsubscribe`).reply(200, mockResponse);

        const result = await diveEventAPI.unsubscribeUserToEvent(eventId);
        expect(result).toEqual(mockResponse);
    });

    it("should join waiting list for event", async () => {
        const eventId = 1;
        const mockResponse = {id: eventId, status: "PUBLISHED"};
        mock.onPost(`/${eventId}/waiting-list/join`).reply(200, mockResponse);

        const result = await diveEventAPI.joinWaitingList(eventId);
        expect(result).toEqual(mockResponse);
    });

    it("should leave waiting list for event", async () => {
        const eventId = 1;
        const mockResponse = {id: eventId, status: "PUBLISHED"};
        mock.onPost(`/${eventId}/waiting-list/leave`).reply(200, mockResponse);

        const result = await diveEventAPI.leaveWaitingList(eventId);
        expect(result).toEqual(mockResponse);
    });

    it("should get dive event dives", async () => {
        const eventId = 1;
        const mockResponse = {dives: [{id: 1, eventId, depth: 20}]};
        mock.onGet(`/${eventId}/dives`).reply(200, mockResponse);

        const result = await diveEventAPI.getDiveEventDives(eventId);
        expect(result).toEqual(mockResponse);
    });

    it("should find all events", async () => {
        const mockResponse = [{id: 1, title: "Event 1"}, {id: 2, title: "Event 2"}];
        mock.onGet("").reply(200, mockResponse);

        const result = await diveEventAPI.findAll();
        expect(result).toEqual(mockResponse);
    });

    it("should find event by id", async () => {
        const mockResponse = {id: 1, title: "Event 1"};
        mock.onGet("/1").reply(200, mockResponse);

        const result = await diveEventAPI.findById(1, null);
        expect(result).toEqual(mockResponse);
    });

    it("should create event", async () => {
        const payload = {title: "New Event"} as unknown as DiveEventRequest;
        const mockResponse = {id: 1, title: "New Event"};
        mock.onPost("", payload).reply(200, mockResponse);

        const result = await diveEventAPI.create(payload);
        expect(result).toEqual(mockResponse);
    });

    it("should update event", async () => {
        const payload = {id: 1, title: "Updated Event"} as unknown as DiveEventRequest;
        const mockResponse = {id: 1, title: "Updated Event"};
        mock.onPut("", payload).reply(200, mockResponse);

        const result = await diveEventAPI.update(payload);
        expect(result).toEqual(mockResponse);
    });

    it("should delete event", async () => {
        mock.onDelete("/1").reply(204);
        await diveEventAPI.delete(1);
        expect(mock.history.delete).toHaveLength(1);
    });
});
