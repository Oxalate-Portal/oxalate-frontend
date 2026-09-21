import {fileTransferAPI} from "../services";
import MockAdapter from "axios-mock-adapter";

describe("FileTransferAPI", () => {
    let mock: MockAdapter;

    beforeEach(() => {
        mock = new MockAdapter(fileTransferAPI["axiosInstance"]);
    });


    afterEach(() => {
        mock.reset();
    });

    const page = (files: object[]) => ({
        content: files,
        page: 0,
        size: 10,
        total_elements: files.length,
        total_pages: 1,
        first: true,
        last: true,
        empty: files.length === 0
    });
    const request = {page: 0, size: 10, sort_by: "created_at", direction: "DESC" as const, search: "jpg", case_sensitive: true};
    const expectedParams = {page: 0, size: 10, sort_by: "created_at", direction: "DESC", search: "jpg", case_sensitive: true};

    describe("Avatar files", () => {
        it("should find a page of avatar files with the paging query parameters", async () => {
            mock.onGet("/avatars").reply(200, page([{id: 1, filename: "avatar1.jpg", created_at: "2026-01-01T10:00:00Z"}, {id: 2, filename: "avatar2.jpg"}]));

            const result = await fileTransferAPI.findAllAvatarFiles(request);

            expect(mock.history.get[0]?.params).toEqual(expectedParams);
            expect(result.total_elements).toBe(2);
            expect(result.content.map((file) => file.id)).toEqual([1, 2]);
            expect(typeof result.content[0].created_at.isValid).toBe("function");
        });

        it("should remove avatar file", async () => {
            const mockResponse = {status: "SUCCESS"};
            mock.onDelete("/avatars/1").reply(200, mockResponse);

            const result = await fileTransferAPI.removeAvatarFile(1);
            expect(result).toEqual(mockResponse);
        });

        it("uploadAvatarFileValidOk", async () => {
            const mockResponse = {url: "/files/avatars/1"};
            const uploadFile = new File(["avatar"], "avatar.png", {type: "image/png"});
            mock.onPost("/avatars").reply(200, mockResponse);

            const result = await fileTransferAPI.uploadAvatarFile(uploadFile);
            expect(result).toEqual(mockResponse);
        });
    });

    describe("Certificate files", () => {
        it("should find a page of certificate files", async () => {
            mock.onGet("/certificates").reply(200, page([{id: 1, filename: "cert1.pdf"}]));

            const result = await fileTransferAPI.findAllCertificateFiles(request);

            expect(mock.history.get[0]?.params).toEqual(expectedParams);
            expect(result.content).toEqual([{id: 1, filename: "cert1.pdf"}]);
        });

        it("should remove certificate file", async () => {
            const mockResponse = {status: "SUCCESS"};
            mock.onDelete("/certificates/1").reply(200, mockResponse);

            const result = await fileTransferAPI.removeCertificateFile(1);
            expect(result).toEqual(mockResponse);
        });
    });

    describe("Dive files", () => {
        it("should find a page of dive files, optionally restricted to an event", async () => {
            mock.onGet("/dive-files").reply(200, page([{id: 1, filename: "dive1.pdf"}]));

            const all = await fileTransferAPI.findAllDiveFiles({page: 0, size: 10});
            const forEvent = await fileTransferAPI.findAllDiveFiles(request, 12);

            expect(mock.history.get[0]?.params).toEqual({page: 0, size: 10});
            expect(mock.history.get[1]?.params).toEqual({...expectedParams, event_id: 12});
            expect(all.content).toEqual([{id: 1, filename: "dive1.pdf"}]);
            expect(forEvent.last).toBe(true);
        });

        it("should remove dive file", async () => {
            const mockResponse = {status: "SUCCESS"};
            mock.onDelete("/dive-files/1").reply(200, mockResponse);

            const result = await fileTransferAPI.removeDiveFile(1);
            expect(result).toEqual(mockResponse);
        });

        it("uploadDiveFileValidOk", async () => {
            const mockResponse = {url: "/files/dive-files/1"};
            const uploadFile = new File(["dive"], "dive-plan.pdf", {type: "application/pdf"});
            mock.onPost("/dive-files?event_id=12&dive_group_id=3").reply((config) => {
                expect(config.data).toBeInstanceOf(FormData);
                expect(config.headers?.["Content-Type"]).toContain("multipart/form-data");
                return [200, mockResponse];
            });

            const result = await fileTransferAPI.uploadDiveFile(uploadFile, 12, 3);
            expect(result).toEqual(mockResponse);
        });
    });

    describe("Document files", () => {
        it("should find a page of documents", async () => {
            mock.onGet("/documents").reply(200, page([{id: 1, filename: "doc1.pdf"}]));

            const result = await fileTransferAPI.findAllDocuments(request);

            expect(mock.history.get[0]?.params).toEqual(expectedParams);
            expect(result.content).toEqual([{id: 1, filename: "doc1.pdf"}]);
        });

        it("should find a page of creator-scoped documents", async () => {
            mock.onGet("/documents").reply(200, page([{id: 2, filename: "doc2.pdf"}]));

            const result = await fileTransferAPI.findAllDocuments({page: 1, size: 5}, 5);

            expect(mock.history.get[0]?.params).toEqual({page: 1, size: 5, creator_id: 5});
            expect(result.content).toEqual([{id: 2, filename: "doc2.pdf"}]);
        });

        it("should remove document file", async () => {
            const mockResponse = {status: "SUCCESS"};
            mock.onDelete("/documents/1").reply(200, mockResponse);

            const result = await fileTransferAPI.removeDocumentFile(1);
            expect(result).toEqual(mockResponse);
        });

        it("uploadDocumentFileValidOk", async () => {
            const mockResponse = {url: "/files/documents/2"};
            const uploadFile = new File(["doc"], "membership.pdf", {type: "application/pdf"});
            mock.onPost("/documents").reply(200, mockResponse);

            const result = await fileTransferAPI.uploadDocumentFile(uploadFile);
            expect(result).toEqual(mockResponse);
        });
    });

    describe("Page files", () => {
        it("should find a page of page files", async () => {
            mock.onGet("/page-files").reply(200, page([{id: 1, filename: "page1.jpg"}]));

            const result = await fileTransferAPI.findAllPageFiles(request);

            expect(mock.history.get[0]?.params).toEqual(expectedParams);
            expect(result.content).toEqual([{id: 1, filename: "page1.jpg"}]);
        });

        it("should remove page file", async () => {
            const mockResponse = {status: "SUCCESS"};
            mock.onDelete("/page-files/1/en/page1.jpg").reply(200, mockResponse);

            const result = await fileTransferAPI.removePageFile(1, "en", "page1.jpg");
            expect(result).toEqual(mockResponse);
        });
    });
});
