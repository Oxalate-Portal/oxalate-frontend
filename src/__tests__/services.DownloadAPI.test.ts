import {downloadAPI} from '../services';
import MockAdapter from 'axios-mock-adapter';

describe('DownloadAPI', () => {
    let mock: MockAdapter;

    beforeEach(() => {
        mock = new MockAdapter(downloadAPI['axiosInstance']);
    });

    afterEach(() => {
        mock.reset();
    });

    it('should download certificates', async () => {
        const mockResponse = [{id: 1, certificateName: 'Cert1'}];
        mock.onGet('/certificates').reply(200, mockResponse);

        const result = await downloadAPI.downloadCertificates();
        expect(result).toEqual(mockResponse);
    });

    it('should download dives', async () => {
        const mockResponse = [{id: 1, diveName: 'Dive1', depth: 20}];
        mock.onGet('/dives').reply(200, mockResponse);

        const result = await downloadAPI.downloadDives();
        expect(result).toEqual(mockResponse);
    });

    it('should download payments', async () => {
        const mockResponse = [{id: 1, paymentName: 'Payment1', amount: 100}];
        mock.onGet('/payments').reply(200, mockResponse);

        const result = await downloadAPI.downloadPayments();
        expect(result).toEqual(mockResponse);
    });
});

