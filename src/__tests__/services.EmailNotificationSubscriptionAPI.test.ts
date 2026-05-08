/// <reference types="jest" />
import {emailNotificationSubscriptionAPI} from '../services';
import MockAdapter from 'axios-mock-adapter';
import type {EmailNotificationSubscriptionRequest} from '../models';

describe('EmailNotificationSubscriptionAPI', () => {
    let mock: MockAdapter;

    beforeEach(() => {
        mock = new MockAdapter(emailNotificationSubscriptionAPI['axiosInstance']);
    });

    afterEach(() => {
        mock.reset();
    });

    it('should get user email subscriptions', async () => {
        const mockResponse = [
            {id: 1, type: 'NEW_EVENT', subscribed: true},
            {id: 2, type: 'COMMENT_REPLY', subscribed: false}
        ];
        mock.onGet('').reply(200, mockResponse);

        const result = await emailNotificationSubscriptionAPI.getUserEmailSubscriptions();
        expect(result).toEqual(mockResponse);
    });

    it('should subscribe to email notification', async () => {
        const payload = {type: 'NEW_EVENT', subscribed: true} as unknown as EmailNotificationSubscriptionRequest;
        const mockResponse = [{id: 1, type: 'NEW_EVENT', subscribed: true}];
        mock.onPost('', payload).reply(200, mockResponse);

        const result = await emailNotificationSubscriptionAPI.subscribeToEmailNotification(payload);
        expect(result).toEqual(mockResponse);
    });
});

