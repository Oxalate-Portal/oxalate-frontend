/// <reference types="jest" />
import {notificationAPI} from '../services';
import MockAdapter from 'axios-mock-adapter';

describe('NotificationAPI', () => {
    let mock: MockAdapter;

    beforeEach(() => {
        mock = new MockAdapter(notificationAPI['axiosInstance']);
    });

    afterEach(() => {
        mock.reset();
    });

    it('should get unread notifications', async () => {
        const mockResponse = [{id: 1, read: false, message: 'Notification 1'}];
        mock.onGet('/unread').reply(200, mockResponse);

        const result = await notificationAPI.getUnreadNotifications();
        expect(result).toEqual(mockResponse);
    });

    it('should get all notifications', async () => {
        const mockResponse = [
            {id: 1, read: false, message: 'Notification 1'},
            {id: 2, read: true, message: 'Notification 2'}
        ];
        mock.onGet('/all').reply(200, mockResponse);

        const result = await notificationAPI.getAllNotifications();
        expect(result).toEqual(mockResponse);
    });

    it('should mark notifications as read', async () => {
        const markReadRequest = {notificationIds: [1, 2]} as any;
        const mockResponse = {status: 'SUCCESS'};
        mock.onPost('/mark-read', markReadRequest).reply(200, mockResponse);

        const result = await notificationAPI.markNotificationsAsRead(markReadRequest);
        expect(result).toEqual(mockResponse);
    });

    it('should create notification', async () => {
        const messageRequest = {title: 'New Notification', message: 'Test message'} as any;
        const mockResponse = {id: 1, title: 'New Notification', message: 'Test message'};
        mock.onPost('/create', messageRequest).reply(200, mockResponse);

        const result = await notificationAPI.createNotification(messageRequest);
        expect(result).toEqual(mockResponse);
    });

    it('should create bulk notifications', async () => {
        const messageRequest = {title: 'Bulk Notification', message: 'Test message'} as any;
        const mockResponse = {status: 'SUCCESS'};
        mock.onPost('/create-bulk', messageRequest).reply(200, mockResponse);

        const result = await notificationAPI.createBulkNotifications(messageRequest);
        expect(result).toEqual(mockResponse);
    });

    it('should find all notifications', async () => {
        const mockResponse = [{id: 1, read: false, message: 'Notification 1'}];
        mock.onGet('').reply(200, mockResponse);

        const result = await notificationAPI.findAll();
        expect(result).toEqual(mockResponse);
    });

    it('should create notification via abstract api', async () => {
        const payload = {title: 'Test', message: 'Message'} as any;
        const mockResponse = {id: 1, title: 'Test', message: 'Message'};
        mock.onPost('', payload).reply(200, mockResponse);

        const result = await notificationAPI.create(payload);
        expect(result).toEqual(mockResponse);
    });

    it('should update notification', async () => {
        const payload = {id: 1, read: true, message: 'Updated'} as any;
        const mockResponse = {id: 1, read: true, message: 'Updated'};
        mock.onPut('', payload).reply(200, mockResponse);

        const result = await notificationAPI.update(payload);
        expect(result).toEqual(mockResponse);
    });

    it('should delete notification', async () => {
        mock.onDelete('/1').reply(204);
        await notificationAPI.delete(1);
        expect(mock.history.delete).toHaveLength(1);
    });
});

