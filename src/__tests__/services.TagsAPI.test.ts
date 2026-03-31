/// <reference types="jest" />
import {tagsAPI} from '../services';
import MockAdapter from 'axios-mock-adapter';

describe('TagsAPI', () => {
    let mock: MockAdapter;

    beforeEach(() => {
        mock = new MockAdapter(tagsAPI['axiosInstance']);
    });

    afterEach(() => {
        mock.reset();
    });

    it('should find all tags', async () => {
        const mockResponse = [{id: 1, name: 'Tag1'}, {id: 2, name: 'Tag2'}];
        mock.onGet('').reply(200, mockResponse);

        const result = await tagsAPI.findAll();
        expect(result).toEqual(mockResponse);
    });

    it('should find tag by id', async () => {
        const mockResponse = {id: 1, name: 'Tag1'};
        mock.onGet('/1').reply(200, mockResponse);

        const result = await tagsAPI.findById(1, null);
        expect(result).toEqual(mockResponse);
    });

    it('should create tag', async () => {
        const payload = {name: 'New Tag'} as any;
        const mockResponse = {id: 1, name: 'New Tag'};
        mock.onPost('', payload).reply(200, mockResponse);

        const result = await tagsAPI.create(payload);
        expect(result).toEqual(mockResponse);
    });

    it('should update tag', async () => {
        const payload = {id: 1, name: 'Updated Tag'} as any;
        const mockResponse = {id: 1, name: 'Updated Tag'};
        mock.onPut('', payload).reply(200, mockResponse);

        const result = await tagsAPI.update(payload);
        expect(result).toEqual(mockResponse);
    });

    it('should delete tag', async () => {
        mock.onDelete('/1').reply(204);
        await tagsAPI.delete(1);
        expect(mock.history.delete).toHaveLength(1);
    });

    it('should find pageable tags', async () => {
        const mockResponse = {
            content: [{id: 1, name: 'Tag1'}],
            totalElements: 1,
            totalPages: 1,
            number: 0
        };
        mock.onGet('').reply(200, mockResponse);

        const result = await tagsAPI.findPageable();
        expect(result).toEqual(mockResponse);
    });
});

