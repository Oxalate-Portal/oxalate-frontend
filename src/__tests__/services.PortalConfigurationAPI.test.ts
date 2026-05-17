/// <reference types="jest" />
import {portalConfigurationAPI} from '../services';
import MockAdapter from 'axios-mock-adapter';
import type {PortalConfigurationRequest} from '../models';

describe('PortalConfigurationAPI', () => {
    let mock: MockAdapter;
    const globalWithApi = globalThis as { __OXALATE_API_URL__?: string };
    const originalGlobalApiUrl = globalWithApi.__OXALATE_API_URL__;

    beforeEach(() => {
        mock = new MockAdapter(portalConfigurationAPI['axiosInstance']);
    });

    afterEach(() => {
        mock.reset();
        globalWithApi.__OXALATE_API_URL__ = originalGlobalApiUrl;
    });

    it('should use runtime API base URL when requesting frontend configuration', async () => {
        globalWithApi.__OXALATE_API_URL__ = 'http://localhost:8080/api';
        mock.onGet('/frontend').reply(200, []);

        await portalConfigurationAPI.getFrontendConfiguration();

        expect(mock.history.get[0]?.baseURL).toBe('http://localhost:8080/api/configurations');
        expect(mock.history.get[0]?.url).toBe('/frontend');
    });

    it('should find all portal configurations', async () => {
        const mockResponse = [{key: 'config.key1', value: 'value1'}, {key: 'config.key2', value: 'value2'}];
        mock.onGet('').reply(200, mockResponse);

        const result = await portalConfigurationAPI.findAllPortalConfigurations();
        expect(result).toEqual(mockResponse);
    });

    it('should update configuration value', async () => {
        const request = {key: 'config.key1', value: 'newvalue'} as unknown as PortalConfigurationRequest;
        const mockResponse = {key: 'config.key1', value: 'newvalue'};
        mock.onPut('', request).reply(200, mockResponse);

        const result = await portalConfigurationAPI.updateConfigurationValue(request);
        expect(result).toEqual(mockResponse);
    });

    it('should get frontend configuration', async () => {
        const mockResponse = [{key: 'frontend.setting1', value: 'enabled'}];
        mock.onGet('/frontend').reply(200, mockResponse);

        const result = await portalConfigurationAPI.getFrontendConfiguration();
        expect(result).toEqual(mockResponse);
    });

    it('should reload portal configuration', async () => {
        const mockResponse = [{key: 'config.key1', value: 'value1'}];
        mock.onGet('/reload').reply(200, mockResponse);

        const result = await portalConfigurationAPI.reloadPortalConfiguration();
        expect(result).toEqual(mockResponse);
    });
});

