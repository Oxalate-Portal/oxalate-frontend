import {filterDocumentsForCreator, UserDocumentFiles} from "../components/User/UserDocumentFiles";
import {type DocumentFileResponse, UploadStatusEnum} from "../models";
import {render} from "@testing-library/react";
import {fileTransferAPI} from "../services";

jest.mock("../session", () => ({
    useSession: () => ({
        getPortalConfigurationValue: () => "false"
    })
}));

describe("UserDocumentFiles filtering", () => {
    const documents: DocumentFileResponse[] = [
        {
            id: 1,
            filename: "a.pdf",
            filesize: 10,
            mimetype: "application/pdf",
            filechecksum: "x",
            status: UploadStatusEnum.UPLOADED,
            creator: "Doe, Jane",
            createdAt: new Date("2026-01-01T10:00:00Z"),
            url: "/api/files/documents/1"
        },
        {
            id: 2,
            filename: "b.pdf",
            filesize: 12,
            mimetype: "application/pdf",
            filechecksum: "y",
            status: UploadStatusEnum.UPLOADED,
            creator: "Doe, John",
            createdAt: new Date("2026-01-02T10:00:00Z"),
            url: "/api/files/documents/2"
        }
    ];

    it("keeps only creator-matching documents", () => {
        const result = filterDocumentsForCreator(documents, "Doe, Jane");
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe(1);
    });

    it("returns empty when creator does not match", () => {
        const result = filterDocumentsForCreator(documents, "nobody@example.com");
        expect(result).toHaveLength(0);
    });
});

describe("UserDocumentFiles feature gating", () => {
    it("does not request documents when documents feature is disabled", () => {
        const spy = jest.spyOn(fileTransferAPI, "findAllDocuments");

        const {container} = render(
                <UserDocumentFiles userId={1} creatorName={"Doe, Jane"} canUpload={true}/>
        );

        expect(container.firstChild).toBeNull();
        expect(spy).not.toHaveBeenCalled();
        spy.mockRestore();
    });
});

