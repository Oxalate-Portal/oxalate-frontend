/// <reference types="jest" />
import {diveEventAPI} from '../services';
import MockAdapter from 'axios-mock-adapter';

describe('DiveEventAPI', () => {
    let mock: MockAdapter;

    beforeEach(() => {
        mock = new MockAdapter(diveEventAPI['axiosInstance']);
    });

    afterEach(() => {
        mock.reset();
    });

    it('should find dive events by user id', async () => {
        const userId = 1;
        const mockResponse = [{id: 1, userId, title: 'Event 1'}];
        mock.onGet(`/user/${userId}`).reply(200, mockResponse);

        const result = await diveEventAPI.findByUserId(userId);
        expect(result).toEqual(mockResponse);
    });

    it('should find all dive event list items', async () => {
        const mockResponse = [{id: 1, title: 'Event 1'}];
        mock.onGet('/').reply(200, mockResponse);

        const result = await diveEventAPI.findAllDiveEventListItems();
        expect(result).toEqual(mockResponse);
    });

    it('should find all dive event list items by user', async () => {
        const userId = 1;
        const mockResponse = [{id: 1, userId, title: 'Event 1'}];
        mock.onGet(`/user/${userId}`).reply(200, mockResponse);

        const result = await diveEventAPI.findAllDiveEventListItemsByUser(userId);
        expect(result).toEqual(mockResponse);
    });

    it('should find all ongoing dive events', async () => {
        const mockResponse = [{id: 1, status: 'PUBLISHED', title: 'Event 1'}];
        mock.onGet('/ongoing').reply(200, mockResponse);

        const result = await diveEventAPI.findAllOngoingDiveEvents();
        expect(result).toEqual(mockResponse);
    });

    it('should find all past dive events', async () => {
        const mockResponse = [{id: 1, status: 'HELD', title: 'Event 1'}];
        mock.onGet('/past').reply(200, mockResponse);

        const result = await diveEventAPI.findAllPastDiveEvents();
        expect(result).toEqual(mockResponse);
    });

    it('should subscribe user to event', async () => {
        const subscribeRequest = {eventId: 1, userId: 1} as any;
        const mockResponse = {id: 1, status: 'PUBLISHED'};
        mock.onPut('/subscribe', subscribeRequest).reply(200, mockResponse);

        const result = await diveEventAPI.subscribeUserToEvent(subscribeRequest);
        expect(result).toEqual(mockResponse);
    });

    it('should unsubscribe user from event', async () => {
        const eventId = 1;
        const mockResponse = {id: eventId, status: 'PUBLISHED'};
        mock.onDelete(`/${eventId}/unsubscribe`).reply(200, mockResponse);

        const result = await diveEventAPI.unsubscribeUserToEvent(eventId);
        expect(result).toEqual(mockResponse);
    });

    it('should get dive event dives', async () => {
        const eventId = 1;
        const mockResponse = {dives: [{id: 1, eventId, depth: 20}]};
        mock.onGet(`/${eventId}/dives`).reply(200, mockResponse);

        const result = await diveEventAPI.getDiveEventDives(eventId);
        expect(result).toEqual(mockResponse);
    });

    it('should find all events', async () => {
        const mockResponse = [{id: 1, title: 'Event 1'}, {id: 2, title: 'Event 2'}];
        mock.onGet('').reply(200, mockResponse);

        const result = await diveEventAPI.findAll();
        expect(result).toEqual(mockResponse);
    });

    it('should find event by id', async () => {
        const mockResponse = {id: 1, title: 'Event 1'};
        mock.onGet('/1').reply(200, mockResponse);

        const result = await diveEventAPI.findById(1, null);
        expect(result).toEqual(mockResponse);
    });

    it('should create event', async () => {
        const payload = {title: 'New Event'} as any;
        const mockResponse = {id: 1, title: 'New Event'};
        mock.onPost('', payload).reply(200, mockResponse);

        const result = await diveEventAPI.create(payload);
        expect(result).toEqual(mockResponse);
    });

    it('should update event', async () => {
        const payload = {id: 1, title: 'Updated Event'} as any;
        const mockResponse = {id: 1, title: 'Updated Event'};
        mock.onPut('', payload).reply(200, mockResponse);

        const result = await diveEventAPI.update(payload);
        expect(result).toEqual(mockResponse);
    });

    it('should delete event', async () => {
        mock.onDelete('/1').reply(204);
        await diveEventAPI.delete(1);
        expect(mock.history.delete).toHaveLength(1);
    });
});

