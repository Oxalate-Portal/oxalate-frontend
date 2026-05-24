import {fileTransferAPI} from '../services';
import MockAdapter from 'axios-mock-adapter';

describe('FileTransferAPI', () => {
    let mock: MockAdapter;

    beforeEach(() => {
        mock = new MockAdapter(fileTransferAPI['axiosInstance']);
    });

    afterEach(() => {
        mock.reset();
    });

    describe('Avatar files', () => {
        it('should find all avatar files', async () => {
            const mockResponse = [{id: 1, fileName: 'avatar1.jpg'}, {id: 2, fileName: 'avatar2.jpg'}];
            mock.onGet('/avatars').reply(200, mockResponse);

            const result = await fileTransferAPI.findAllAvatarFiles();
            expect(result).toEqual(mockResponse);
        });

        it('should remove avatar file', async () => {
            const mockResponse = {status: 'SUCCESS'};
            mock.onDelete('/avatars/1').reply(200, mockResponse);

            const result = await fileTransferAPI.removeAvatarFile(1);
            expect(result).toEqual(mockResponse);
        });

        it('uploadAvatarFileValidOk', async () => {
            const mockResponse = {url: '/files/avatars/1'};
            const uploadFile = new File(['avatar'], 'avatar.png', {type: 'image/png'});
            mock.onPost('/avatars').reply(200, mockResponse);

            const result = await fileTransferAPI.uploadAvatarFile(uploadFile);
            expect(result).toEqual(mockResponse);
        });
    });

    describe('Certificate files', () => {
        it('should find all certificate files', async () => {
            const mockResponse = [{id: 1, fileName: 'cert1.pdf'}];
            mock.onGet('/certificates').reply(200, mockResponse);

            const result = await fileTransferAPI.findAllCertificateFiles();
            expect(result).toEqual(mockResponse);
        });

        it('should remove certificate file', async () => {
            const mockResponse = {status: 'SUCCESS'};
            mock.onDelete('/certificates/1').reply(200, mockResponse);

            const result = await fileTransferAPI.removeCertificateFile(1);
            expect(result).toEqual(mockResponse);
        });
    });

    describe('Dive files', () => {
        it('should find all dive files', async () => {
            const mockResponse = [{id: 1, fileName: 'dive1.pdf'}];
            mock.onGet('/dive-files').reply(200, mockResponse);

            const result = await fileTransferAPI.findAllDiveFiles();
            expect(result).toEqual(mockResponse);
        });

        it('should remove dive file', async () => {
            const mockResponse = {status: 'SUCCESS'};
            mock.onDelete('/dive-files/1').reply(200, mockResponse);

            const result = await fileTransferAPI.removeDiveFile(1);
            expect(result).toEqual(mockResponse);
        });

        it('uploadDiveFileValidOk', async () => {
            const mockResponse = {url: '/files/dive-files/1'};
            const uploadFile = new File(['dive'], 'dive-plan.pdf', {type: 'application/pdf'});
            mock.onPost('/dive-files?eventId=12&diveGroupId=3').reply(200, mockResponse);

            const result = await fileTransferAPI.uploadDiveFile(uploadFile, 12, 3);
            expect(result).toEqual(mockResponse);
        });
    });

    describe('Document files', () => {
        it('should find all documents', async () => {
            const mockResponse = [{id: 1, fileName: 'doc1.pdf'}];
            mock.onGet('/documents').reply(200, mockResponse);

            const result = await fileTransferAPI.findAllDocuments();
            expect(result).toEqual(mockResponse);
        });

        it('should find creator-scoped documents', async () => {
            const mockResponse = [{id: 2, fileName: 'doc2.pdf'}];
            mock.onGet('/documents?creatorId=5').reply(200, mockResponse);

            const result = await fileTransferAPI.findAllDocuments(5);
            expect(result).toEqual(mockResponse);
        });

        it('should remove document file', async () => {
            const mockResponse = {status: 'SUCCESS'};
            mock.onDelete('/documents/1').reply(200, mockResponse);

            const result = await fileTransferAPI.removeDocumentFile(1);
            expect(result).toEqual(mockResponse);
        });

        it('uploadDocumentFileValidOk', async () => {
            const mockResponse = {url: '/files/documents/2'};
            const uploadFile = new File(['doc'], 'membership.pdf', {type: 'application/pdf'});
            mock.onPost('/documents').reply(200, mockResponse);

            const result = await fileTransferAPI.uploadDocumentFile(uploadFile);
            expect(result).toEqual(mockResponse);
        });
    });

    describe('Page files', () => {
        it('should find all page files', async () => {
            const mockResponse = [{id: 1, fileName: 'page1.jpg'}];
            mock.onGet('/page-files').reply(200, mockResponse);

            const result = await fileTransferAPI.findAllPageFiles();
            expect(result).toEqual(mockResponse);
        });

        it('should remove page file', async () => {
            const mockResponse = {status: 'SUCCESS'};
            mock.onDelete('/page-files/1/en/page1.jpg').reply(200, mockResponse);

            const result = await fileTransferAPI.removePageFile(1, 'en', 'page1.jpg');
            expect(result).toEqual(mockResponse);
        });
    });
});

