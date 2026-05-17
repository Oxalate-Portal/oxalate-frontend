/// <reference types="jest" />
import {adminUserAPI} from '../services';
import MockAdapter from 'axios-mock-adapter';
import type {AdminUserRequest} from '../models';

describe('AdminUserAPI', () => {
    let mock: MockAdapter;

    beforeEach(() => {
        mock = new MockAdapter(adminUserAPI['axiosInstance']);
    });

    afterEach(() => {
        mock.reset();
    });

    it('should find all admin users', async () => {
        const mockResponse = [{id: 1, email: 'admin1@example.com'}, {id: 2, email: 'admin2@example.com'}];
        mock.onGet('').reply(200, mockResponse);

        const result = await adminUserAPI.findAll();
        expect(result).toEqual(mockResponse);
    });

    it('should find admin user by id', async () => {
        const mockResponse = {id: 1, email: 'admin@example.com'};
        mock.onGet('/1').reply(200, mockResponse);

        const result = await adminUserAPI.findById(1, null);
        expect(result).toEqual(mockResponse);
    });

    it('should create admin user', async () => {
        const payload = {email: 'newadmin@example.com'} as unknown as AdminUserRequest;
        const mockResponse = {id: 1, email: 'newadmin@example.com'};
        mock.onPost('', payload).reply(200, mockResponse);

        const result = await adminUserAPI.create(payload);
        expect(result).toEqual(mockResponse);
    });

    it('should update admin user', async () => {
        const payload = {id: 1, email: 'updated@example.com'} as unknown as AdminUserRequest;
        const mockResponse = {id: 1, email: 'updated@example.com'};
        mock.onPut('', payload).reply(200, mockResponse);

        const result = await adminUserAPI.update(payload);
        expect(result).toEqual(mockResponse);
    });

    it('should delete admin user', async () => {
        mock.onDelete('/1').reply(204);
        await adminUserAPI.delete(1);
        expect(mock.history.delete).toHaveLength(1);
    });

    it('should find pageable admin users', async () => {
        const mockResponse = {
            content: [{id: 1, email: 'admin@example.com'}],
            totalElements: 1,
            totalPages: 1,
            number: 0
        };
        mock.onGet('').reply(200, mockResponse);

        const result = await adminUserAPI.findPageable();
        expect(result).toEqual(mockResponse);
    });
});

