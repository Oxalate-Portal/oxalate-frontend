/// <reference types="jest" />
import {userAPI} from '../services';
import MockAdapter from 'axios-mock-adapter';
import {RoleEnum, UserStatusEnum} from '../models';
import type {AdminUserRequest, ConfirmationRequest} from '../models';

describe('UserAPI', () => {
    let mock: MockAdapter;

    beforeEach(() => {
        mock = new MockAdapter(userAPI['axiosInstance']);
    });

    afterEach(() => {
        mock.reset();
    });

    it('should update user status', async () => {
        const userId = 1;
        const status = UserStatusEnum.ACTIVE;
        const mockResponse = {id: userId, status};

        mock.onPut('/1/status').reply(200, mockResponse);

        const result = await userAPI.updateUserStatus(userId, status);
        expect(result).toEqual(mockResponse);
    });

    it('should accept terms', async () => {
        const payload = {confirmationAnswer: true} as unknown as ConfirmationRequest;
        mock.onPut('/accept-terms').reply(200);
        await userAPI.acceptTerms(payload);
        expect(mock.history.put.length).toBeGreaterThan(0);
    });

    it('should accept health statement', async () => {
        const payload = {confirmationAnswer: true} as unknown as ConfirmationRequest;
        mock.onPut('/confirm-health-check').reply(200);
        await userAPI.acceptHealthStatement(payload);
        expect(mock.history.put.length).toBeGreaterThan(0);
    });

    it('should find users by role', async () => {
        const role = RoleEnum.ROLE_USER;
        const mockResponse = [{id: 1, email: 'user1@example.com', role}];
        mock.onGet(`/role/${role}`).reply(200, mockResponse);
        const result = await userAPI.findByRole(role);
        expect(result).toEqual(mockResponse);
    });

    it('should find admin user by id', async () => {
        const userId = 1;
        const mockResponse = {id: userId, email: 'admin@example.com', role: RoleEnum.ROLE_ADMIN};
        mock.onGet('/1').reply(200, mockResponse);
        const result = await userAPI.findAdminUserById(userId);
        expect(result).toEqual(mockResponse);
    });

    it('should reset terms', async () => {
        mock.onGet('/reset-terms').reply(200);
        const result = await userAPI.resetTerms();
        expect(result).toBe(true);
    });

    it('should reset health statement', async () => {
        mock.onGet('/reset-health-check').reply(200);
        const result = await userAPI.resetHealthStatement();
        expect(result).toBe(true);
    });

    it('should admin update user', async () => {
        const postData = {id: 1, email: 'user@example.com', status: UserStatusEnum.ACTIVE} as unknown as AdminUserRequest;
        const mockResponse = {id: 1, email: 'user@example.com', status: UserStatusEnum.ACTIVE};
        mock.onPut('').reply(200, mockResponse);
        const result = await userAPI.adminUpdateUser(postData);
        expect(result).toEqual(mockResponse);
    });
});
