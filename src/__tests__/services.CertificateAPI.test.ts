/// <reference types="jest" />
import {certificateAPI} from '../services';
import MockAdapter from 'axios-mock-adapter';
import type {CertificateRequest} from '../models';

describe('CertificateAPI', () => {
    let mock: MockAdapter;

    beforeEach(() => {
        mock = new MockAdapter(certificateAPI['axiosInstance']);
    });

    afterEach(() => {
        mock.reset();
    });

    it('should find all certificates', async () => {
        const mockResponse = [{id: 1, name: 'Cert1'}, {id: 2, name: 'Cert2'}];
        mock.onGet('').reply(200, mockResponse);

        const result = await certificateAPI.findAll();
        expect(result).toEqual(mockResponse);
    });

    it('should find all certificates by user id', async () => {
        const userId = 1;
        const mockResponse = [{id: 1, name: 'Cert1', userId}];
        mock.onGet(`/user/${userId}`).reply(200, mockResponse);

        const result = await certificateAPI.findAllByUserId(userId);
        expect(result).toEqual(mockResponse);
    });

    it('should find certificate by id', async () => {
        const mockResponse = {id: 1, name: 'Cert1'};
        mock.onGet('/1').reply(200, mockResponse);

        const result = await certificateAPI.findById(1, null);
        expect(result).toEqual(mockResponse);
    });

    it('should create certificate', async () => {
        const payload = {name: 'New Cert'} as unknown as CertificateRequest;
        const mockResponse = {id: 1, name: 'New Cert'};
        mock.onPost('', payload).reply(200, mockResponse);

        const result = await certificateAPI.create(payload);
        expect(result).toEqual(mockResponse);
    });

    it('should update certificate', async () => {
        const payload = {id: 1, name: 'Updated Cert'} as unknown as CertificateRequest;
        const mockResponse = {id: 1, name: 'Updated Cert'};
        mock.onPut('', payload).reply(200, mockResponse);

        const result = await certificateAPI.update(payload);
        expect(result).toEqual(mockResponse);
    });

    it('should delete certificate', async () => {
        mock.onDelete('/1').reply(204);
        await certificateAPI.delete(1);
        expect(mock.history.delete).toHaveLength(1);
    });

    it('should update a certificate classification', async () => {
        const payload = {certificateId: 1, classificationId: 2};
        mock.onPut('/classification', payload).reply(200);
        await expect(certificateAPI.updateClassification(payload)).resolves.toBe(true);
    });

    it('should replace organizations and certificate names', async () => {
        const payload = {existingValues: ['Old'], newValue: 'New'};
        mock.onPut('/management/organization', payload).reply(200);
        mock.onPut('/management/certificate-name', payload).reply(200);
        await expect(certificateAPI.replaceOrganizations(payload)).resolves.toBe(true);
        await expect(certificateAPI.replaceCertificateNames(payload)).resolves.toBe(true);
    });
});
