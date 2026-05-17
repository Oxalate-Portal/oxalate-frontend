import {statsAPI} from '../services';
import MockAdapter from 'axios-mock-adapter';

describe('StatsAPI', () => {
    let mock: MockAdapter;

    beforeEach(() => {
        mock = new MockAdapter(statsAPI['axiosInstance']);
    });

    afterEach(() => {
        mock.reset();
    });

    it('should get yearly diver list', async () => {
        const mockResponse = [{year: 2023, count: 50}, {year: 2024, count: 75}];
        mock.onGet('/yearly-diver-list').reply(200, mockResponse);

        const result = await statsAPI.getYearlyDiverList();
        expect(result).toEqual(mockResponse);
    });

    it('should get dive event reports', async () => {
        const mockResponse = [{year: 2023, events: 10}, {year: 2024, events: 15}];
        mock.onGet('/event-report').reply(200, mockResponse);

        const result = await statsAPI.getDiveEventReports();
        expect(result).toEqual(mockResponse);
    });

    it('should get yearly stats data', async () => {
        const type = 'events';
        const mockResponse = [{year: 2023, value: 10}, {year: 2024, value: 15}];
        mock.onGet(`/yearly-${type}`).reply(200, mockResponse);

        const result = await statsAPI.getYearlyStatsData(type);
        expect(result).toEqual(mockResponse);
    });

    it('should get aggregates', async () => {
        const mockResponse = {
            eventsPerYear: [{year: 2023, value: 10}],
            diversPerYear: [{year: 2023, value: 50}],
            eventTypesPerYear: [{year: 2023, type: 'BOAT', value: 5}],
            diverTypesPerYear: [{year: 2023, type: 'SCUBA_DIVER', value: 30}]
        };
        mock.onGet('/yearly-aggregates').reply(200, mockResponse);

        const result = await statsAPI.getAggregates();
        expect(result).toEqual(mockResponse);
    });
});

