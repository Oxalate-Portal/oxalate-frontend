/// <reference types="jest" />
import {portalConfigurationAPI} from '../services';
import MockAdapter from 'axios-mock-adapter';
import type {PortalConfigurationRequest} from '../models';

describe('PortalConfigurationAPI', () => {
    let mock: MockAdapter;

    beforeEach(() => {
        mock = new MockAdapter(portalConfigurationAPI['axiosInstance']);
    });

    afterEach(() => {
        mock.reset();
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

