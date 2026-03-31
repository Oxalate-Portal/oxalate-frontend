/// <reference types="jest" />
import {commentAPI} from '../services';
import MockAdapter from 'axios-mock-adapter';

describe('CommentAPI', () => {
    let mock: MockAdapter;

    beforeEach(() => {
        mock = new MockAdapter(commentAPI['axiosInstance']);
    });

    afterEach(() => {
        mock.reset();
    });

    it('should find all comments for parent id', async () => {
        const parentId = 1;
        const mockResponse = {id: 1, parentId, text: 'Comment text'};
        mock.onGet(`/${parentId}`).reply(200, mockResponse);

        const result = await commentAPI.findAllForParentId(parentId);
        expect(result).toEqual(mockResponse);
    });

    it('should find all comments with depth', async () => {
        const parentId = 1;
        const depth = 2;
        const mockResponse = {id: 1, parentId, depth, text: 'Comment text'};
        mock.onGet(`/${parentId}/${depth}`).reply(200, mockResponse);

        const result = await commentAPI.findAllForParentIdWithDepth(parentId, depth);
        expect(result).toEqual(mockResponse);
    });

    it('should report a comment', async () => {
        const reportRequest = {commentId: 1, reason: 'Spam'} as any;
        const mockResponse = {status: 'SUCCESS'};
        mock.onPost('/report', reportRequest).reply(200, mockResponse);

        const result = await commentAPI.report(reportRequest);
        expect(result).toEqual(mockResponse);
    });

    it('should cancel report', async () => {
        const commentId = 1;
        const mockResponse = {status: 'SUCCESS'};
        mock.onPost(`/cancel-report${commentId}`).reply(200, mockResponse);

        const result = await commentAPI.cancelReport(commentId);
        expect(result).toEqual(mockResponse);
    });

    it('should get pending reports', async () => {
        const mockResponse = [{id: 1, commentId: 1, status: 'PENDING'}];
        mock.onGet('/pending-reports').reply(200, mockResponse);

        const result = await commentAPI.getPendingReports();
        expect(result).toEqual(mockResponse);
    });

    it('should reject comment', async () => {
        const commentId = 1;
        const mockResponse = [{id: 1, commentId, status: 'REJECTED'}];
        mock.onGet(`/reject-comment/${commentId}`).reply(200, mockResponse);

        const result = await commentAPI.rejectComment(commentId);
        expect(result).toEqual(mockResponse);
    });

    it('should reject reports', async () => {
        const commentId = 1;
        const mockResponse = [{id: 1, commentId, status: 'REJECTED'}];
        mock.onGet(`/reject-reports/${commentId}`).reply(200, mockResponse);

        const result = await commentAPI.rejectReports(commentId);
        expect(result).toEqual(mockResponse);
    });

    it('should accept report', async () => {
        const reportId = 1;
        const mockResponse = [{id: reportId, status: 'ACCEPTED'}];
        mock.onGet(`/accept-report/${reportId}`).reply(200, mockResponse);

        const result = await commentAPI.acceptReport(reportId);
        expect(result).toEqual(mockResponse);
    });

    it('should dismiss report', async () => {
        const reportId = 1;
        const mockResponse = [{id: reportId, status: 'DISMISSED'}];
        mock.onGet(`/dismiss-report/${reportId}`).reply(200, mockResponse);

        const result = await commentAPI.dismissReport(reportId);
        expect(result).toEqual(mockResponse);
    });

    it('should find filtered comments', async () => {
        const filter = {status: 'PUBLISHED', limit: 10} as any;
        const mockResponse = [{id: 1, status: 'PUBLISHED'}];
        mock.onPost('/filter', filter).reply(200, mockResponse);

        const result = await commentAPI.findFilteredComments(filter);
        expect(result).toEqual(mockResponse);
    });
});

