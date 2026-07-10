/// <reference types="jest" />
import {notificationAPI} from '../services';
import MockAdapter from 'axios-mock-adapter';
import type {MessageRequest} from '../models';
import {NotificationGroupEnum, UpdateStatusEnum} from '../models';

describe('NotificationAPI - Group Notifications', () => {
    let mock: MockAdapter;

    beforeEach(() => {
        mock = new MockAdapter(notificationAPI['axiosInstance']);
    });

    afterEach(() => {
        mock.reset();
    });

    test('sends bulk notification with group targeting', async () => {
        const messageRequest: MessageRequest = {
            id: 0,
            title: 'Test Title',
            message: 'Test Message',
            description: 'Test Description',
            creator: 1,
            notificationGroup: NotificationGroupEnum.ACTIVE_MEMBERSHIP,
            inactiveDays: undefined
        };
        const mockResponse = {status: UpdateStatusEnum.OK, message: 'Notification sent to 5 users'};
        mock.onPost('/create-bulk').reply(200, mockResponse);

        const result = await notificationAPI.createBulkNotifications(messageRequest);

        expect(mock.history.post).toHaveLength(1);
        expect(JSON.parse(mock.history.post[0].data)).toMatchObject({
            notificationGroup: NotificationGroupEnum.ACTIVE_MEMBERSHIP
        });
        expect(result.status).toBe(UpdateStatusEnum.OK);
    });

    test('sends bulk notification with inactive days group', async () => {
        const messageRequest: MessageRequest = {
            id: 0,
            title: 'Inactive Users',
            message: 'Please log in',
            description: 'Reminder for inactive users',
            creator: 1,
            notificationGroup: NotificationGroupEnum.INACTIVE_DAYS,
            inactiveDays: 30
        };
        const mockResponse = {status: UpdateStatusEnum.OK, message: 'Notification sent to 12 inactive users'};
        mock.onPost('/create-bulk').reply(200, mockResponse);

        const result = await notificationAPI.createBulkNotifications(messageRequest);

        expect(JSON.parse(mock.history.post[0].data)).toMatchObject({
            notificationGroup: NotificationGroupEnum.INACTIVE_DAYS,
            inactiveDays: 30
        });
        expect(result.status).toBe(UpdateStatusEnum.OK);
    });

    test('sends bulk notification with locked accounts group', async () => {
        const messageRequest: MessageRequest = {
            id: 0,
            title: 'Account Locked',
            message: 'Your account is locked',
            description: 'Notification for locked accounts',
            creator: 1,
            notificationGroup: NotificationGroupEnum.LOCKED_ACCOUNTS
        };
        mock.onPost('/create-bulk').reply(200, {status: UpdateStatusEnum.OK, message: 'Sent to 2 locked accounts'});

        const result = await notificationAPI.createBulkNotifications(messageRequest);

        expect(mock.history.post).toHaveLength(1);
        expect(result.status).toBe(UpdateStatusEnum.OK);
    });

    test('sends bulk notification with no active membership group', async () => {
        const messageRequest: MessageRequest = {
            id: 0,
            title: 'Membership Offer',
            message: 'Interested in becoming a member?',
            description: 'Offer for non-members',
            creator: 1,
            notificationGroup: NotificationGroupEnum.NO_ACTIVE_MEMBERSHIP
        };
        mock.onPost('/create-bulk').reply(200, {status: UpdateStatusEnum.OK, message: 'Sent to 8 non-members'});

        const result = await notificationAPI.createBulkNotifications(messageRequest);

        expect(JSON.parse(mock.history.post[0].data)).toMatchObject({
            notificationGroup: NotificationGroupEnum.NO_ACTIVE_MEMBERSHIP
        });
        expect(result.status).toBe(UpdateStatusEnum.OK);
    });

    test('sends bulk notification with never had membership group', async () => {
        const messageRequest: MessageRequest = {
            id: 0,
            title: 'Join Our Community',
            message: 'Become a member today',
            description: 'Invitation for new members',
            creator: 1,
            notificationGroup: NotificationGroupEnum.NEVER_HAD_MEMBERSHIP
        };
        mock.onPost('/create-bulk').reply(200, {status: UpdateStatusEnum.OK, message: 'Sent to 15 potential members'});

        const result = await notificationAPI.createBulkNotifications(messageRequest);

        expect(JSON.parse(mock.history.post[0].data)).toMatchObject({
            notificationGroup: NotificationGroupEnum.NEVER_HAD_MEMBERSHIP
        });
        expect(result.status).toBe(UpdateStatusEnum.OK);
    });

    test('handles failed group notification request', async () => {
        const messageRequest: MessageRequest = {
            id: 0,
            title: 'Test',
            message: 'Test',
            description: 'Test',
            creator: 1,
            notificationGroup: NotificationGroupEnum.ACTIVE_MEMBERSHIP
        };
        mock.onPost('/create-bulk').networkError();

        await expect(notificationAPI.createBulkNotifications(messageRequest)).rejects.toThrow();
    });

    test('sends notification with all parameters including group', async () => {
        const messageRequest: MessageRequest = {
            id: 0,
            title: 'Complete Notification',
            message: 'This is a complete notification',
            description: 'Full description',
            creator: 123,
            notificationGroup: NotificationGroupEnum.INACTIVE_DAYS,
            inactiveDays: 7
        };
        mock.onPost('/create-bulk').reply(200, {status: UpdateStatusEnum.OK, message: 'Sent successfully'});

        await notificationAPI.createBulkNotifications(messageRequest);

        expect(JSON.parse(mock.history.post[0].data)).toMatchObject({
            title: 'Complete Notification',
            message: 'This is a complete notification',
            description: 'Full description',
            creator: 123,
            notificationGroup: NotificationGroupEnum.INACTIVE_DAYS,
            inactiveDays: 7
        });
    });

    test('still supports sending with recipients (backward compatibility)', async () => {
        const messageRequest: MessageRequest = {
            id: 0,
            title: 'Test',
            message: 'Test message',
            description: 'Test',
            creator: 1,
            recipients: [1, 2, 3]
        };
        mock.onPost('/create-bulk').reply(200, {status: UpdateStatusEnum.OK, message: 'Sent to 3 users'});

        const result = await notificationAPI.createBulkNotifications(messageRequest);

        expect(result.status).toBe(UpdateStatusEnum.OK);
        expect(mock.history.post).toHaveLength(1);
    });

    test('still supports sending with sendAll (backward compatibility)', async () => {
        const messageRequest: MessageRequest = {
            id: 0,
            title: 'Test',
            message: 'Test message',
            description: 'Test',
            creator: 1,
            sendAll: true
        };
        mock.onPost('/create-bulk').reply(200, {status: UpdateStatusEnum.OK, message: 'Sent to all users'});

        const result = await notificationAPI.createBulkNotifications(messageRequest);

        expect(result.status).toBe(UpdateStatusEnum.OK);
    });

    test('includes group and inactiveDays only when set', async () => {
        const messageRequest: MessageRequest = {
            id: 0,
            title: 'Test',
            message: 'Test',
            description: 'Test',
            creator: 1
        };
        mock.onPost('/create-bulk').reply(200, {status: UpdateStatusEnum.OK, message: 'Sent'});

        await notificationAPI.createBulkNotifications(messageRequest);

        expect(JSON.parse(mock.history.post[0].data)).toMatchObject({
            title: 'Test',
            message: 'Test',
            description: 'Test',
            creator: 1
        });
    });

    test('handles response with multiple recipient counts', async () => {
        const messageRequest: MessageRequest = {
            id: 0,
            title: 'Test',
            message: 'Test',
            description: 'Test',
            creator: 1,
            notificationGroup: NotificationGroupEnum.ALL_REGISTERED
        };
        mock.onPost('/create-bulk').reply(200, {status: UpdateStatusEnum.OK, message: 'Notification sent to 1000 users'});

        const result = await notificationAPI.createBulkNotifications(messageRequest);

        expect(result.message).toContain('1000');
    });

    test('handles group notification with zero days (edge case)', async () => {
        const messageRequest: MessageRequest = {
            id: 0,
            title: 'Test',
            message: 'Test',
            description: 'Test',
            creator: 1,
            notificationGroup: NotificationGroupEnum.INACTIVE_DAYS,
            inactiveDays: 0
        };
        mock.onPost('/create-bulk').reply(200, {status: UpdateStatusEnum.OK, message: 'Sent'});

        await notificationAPI.createBulkNotifications(messageRequest);

        expect(JSON.parse(mock.history.post[0].data)).toMatchObject({inactiveDays: 0});
    });

    test('handles network timeout for group notifications', async () => {
        const messageRequest: MessageRequest = {
            id: 0,
            title: 'Test',
            message: 'Test',
            description: 'Test',
            creator: 1,
            notificationGroup: NotificationGroupEnum.ACTIVE_MEMBERSHIP
        };
        mock.onPost('/create-bulk').timeout();

        await expect(notificationAPI.createBulkNotifications(messageRequest)).rejects.toThrow();
    });

    test('preserves all group enum types in API call', async () => {
        const groupTypes = [
            NotificationGroupEnum.ALL_REGISTERED,
            NotificationGroupEnum.INACTIVE_DAYS,
            NotificationGroupEnum.ACTIVE_MEMBERSHIP,
            NotificationGroupEnum.NO_ACTIVE_MEMBERSHIP,
            NotificationGroupEnum.LOCKED_ACCOUNTS,
            NotificationGroupEnum.NEVER_HAD_MEMBERSHIP
        ];

        for (const group of groupTypes) {
            mock.onPost('/create-bulk').reply(200, {status: UpdateStatusEnum.OK, message: 'Sent'});
            const messageRequest: MessageRequest = {
                id: 0,
                title: 'Test',
                message: 'Test',
                description: 'Test',
                creator: 1,
                notificationGroup: group,
                inactiveDays: group === NotificationGroupEnum.INACTIVE_DAYS ? 7 : undefined
            };

            await notificationAPI.createBulkNotifications(messageRequest);
        }

        expect(mock.history.post).toHaveLength(groupTypes.length);
    });
});

