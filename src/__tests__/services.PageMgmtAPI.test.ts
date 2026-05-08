/// <reference types="jest" />
import {pageMgmtAPI} from '../services';
import MockAdapter from 'axios-mock-adapter';
import type {PageRequest} from '../models';

describe('PageMgmtAPI', () => {
    let mock: MockAdapter;

    beforeEach(() => {
        mock = new MockAdapter(pageMgmtAPI['axiosInstance']);
    });

    afterEach(() => {
        mock.reset();
    });

    it('should find all pages', async () => {
        const mockResponse = [{id: 1, title: 'Page 1'}, {id: 2, title: 'Page 2'}];
        mock.onGet('').reply(200, mockResponse);

        const result = await pageMgmtAPI.findAll();
        expect(result).toEqual(mockResponse);
    });

    it('should find page by id', async () => {
        const mockResponse = {id: 1, title: 'Page 1'};
        mock.onGet('/1').reply(200, mockResponse);

        const result = await pageMgmtAPI.findById(1, null);
        expect(result).toEqual(mockResponse);
    });

    it('should create page', async () => {
        const payload = {title: 'New Page'} as unknown as PageRequest;
        const mockResponse = {id: 1, title: 'New Page'};
        mock.onPost('', payload).reply(200, mockResponse);

        const result = await pageMgmtAPI.create(payload);
        expect(result).toEqual(mockResponse);
    });

    it('should update page', async () => {
        const payload = {id: 1, title: 'Updated Page'} as unknown as PageRequest;
        const mockResponse = {id: 1, title: 'Updated Page'};
        mock.onPut('', payload).reply(200, mockResponse);

        const result = await pageMgmtAPI.update(payload);
        expect(result).toEqual(mockResponse);
    });

    it('should delete page', async () => {
        mock.onDelete('/1').reply(204);
        await pageMgmtAPI.delete(1);
        expect(mock.history.delete).toHaveLength(1);
    });

    it('should find pageable pages', async () => {
        const mockResponse = {
            content: [{id: 1, title: 'Page 1'}],
            totalElements: 1,
            totalPages: 1,
            number: 0
        };
        mock.onGet('').reply(200, mockResponse);

        const result = await pageMgmtAPI.findPageable();
        expect(result).toEqual(mockResponse);
    });
});

