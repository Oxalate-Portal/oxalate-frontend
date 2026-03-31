import {auditAPI} from '../services';
import MockAdapter from 'axios-mock-adapter';

describe('AuditAPI', () => {
    let mock: MockAdapter;

    beforeEach(() => {
        mock = new MockAdapter(auditAPI['axiosInstance']);
    });

    afterEach(() => {
        mock.reset();
    });

    it('should find all audit entries', async () => {
        const mockResponse = [
            {id: 1, action: 'CREATE', timestamp: '2024-01-01'},
            {id: 2, action: 'UPDATE', timestamp: '2024-01-02'}
        ];
        mock.onGet('').reply(200, mockResponse);

        const result = await auditAPI.findAll();
        expect(result).toEqual(mockResponse);
    });

    it('should find audit entry by id', async () => {
        const mockResponse = {id: 1, action: 'CREATE', timestamp: '2024-01-01'};
        mock.onGet('/1').reply(200, mockResponse);

        const result = await auditAPI.findById(1, null);
        expect(result).toEqual(mockResponse);
    });

    it('should find pageable audit entries', async () => {
        const mockResponse = {
            content: [{id: 1, action: 'CREATE', timestamp: '2024-01-01'}],
            totalElements: 1,
            totalPages: 1,
            number: 0
        };
        mock.onGet('').reply(200, mockResponse);

        const result = await auditAPI.findPageable();
        expect(result).toEqual(mockResponse);
    });
});

