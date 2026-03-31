/// <reference types="jest" />
import {membershipAPI} from '../services';
import MockAdapter from 'axios-mock-adapter';

describe('MembershipAPI', () => {
    let mock: MockAdapter;

    beforeEach(() => {
        mock = new MockAdapter(membershipAPI['axiosInstance']);
    });

    afterEach(() => {
        mock.reset();
    });

    it('should find memberships by user id', async () => {
        const userId = 1;
        const mockResponse = [{id: 1, userId, type: 'ACTIVE'}];
        mock.onGet(`/user/${userId}`).reply(200, mockResponse);

        const result = await membershipAPI.findByUserId(userId);
        expect(result).toEqual(mockResponse);
    });

    it('should find membership by membership id', async () => {
        const membershipId = 1;
        const mockResponse = {id: membershipId, type: 'ACTIVE'};
        mock.onGet(`/${membershipId}`).reply(200, mockResponse);

        const result = await membershipAPI.findByMemberId(membershipId);
        expect(result).toEqual(mockResponse);
    });

    it('should find all memberships', async () => {
        const mockResponse = [{id: 1, type: 'ACTIVE'}, {id: 2, type: 'EXPIRED'}];
        mock.onGet('').reply(200, mockResponse);

        const result = await membershipAPI.findAll();
        expect(result).toEqual(mockResponse);
    });

    it('should create membership', async () => {
        const payload = {userId: 1, type: 'ACTIVE'} as any;
        const mockResponse = {id: 1, userId: 1, type: 'ACTIVE'};
        mock.onPost('', payload).reply(200, mockResponse);

        const result = await membershipAPI.create(payload);
        expect(result).toEqual(mockResponse);
    });

    it('should update membership', async () => {
        const payload = {id: 1, type: 'EXPIRED'} as any;
        const mockResponse = {id: 1, type: 'EXPIRED'};
        mock.onPut('', payload).reply(200, mockResponse);

        const result = await membershipAPI.update(payload);
        expect(result).toEqual(mockResponse);
    });

    it('should delete membership', async () => {
        mock.onDelete('/1').reply(204);
        await membershipAPI.delete(1);
        expect(mock.history.delete).toHaveLength(1);
    });
});

