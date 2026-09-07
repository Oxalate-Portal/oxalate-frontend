import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import type {ReactNode} from "react";
import {UserDocumentFiles} from "../components";
import {type DocumentFileResponse, UploadStatusEnum} from "../models";
import {fileTransferAPI} from "../services";

const mockMessage = {success: jest.fn(), error: jest.fn()};
const mockMessageContext = [mockMessage, <span key="message-holder"/>] as const;
const translate = (key: string) => key;
const mockSession = {
    documentsSupported: true
};

jest.mock("react-i18next", () => ({
    useTranslation: () => ({t: translate})
}));

jest.mock("../session", () => ({
    useSession: () => ({
        getPortalConfigurationValue: () => mockSession.documentsSupported ? "true" : "false"
    })
}));

jest.mock("../services", () => ({
    fileTransferAPI: {
        findAllDocuments: jest.fn(),
        uploadDocumentFile: jest.fn()
    }
}));

jest.mock("antd", () => {
    const actual = jest.requireActual("antd");

    return {
        ...actual,
        Button: ({children, icon}: { children: ReactNode; icon?: ReactNode }) => (
                <button type="button">{icon}{children}</button>
        ),
        Table: ({dataSource, columns}: {
            dataSource: DocumentFileResponse[];
            columns: Array<{ dataIndex: string; render?: (value: unknown) => ReactNode }>;
        }) => (
                <div data-testid="document-table">
                    {dataSource.map(document => (
                            <div data-testid={"document-" + document.id} key={document.id}>
                                {columns.map(column => (
                                        <span key={column.dataIndex}>
                                {column.render
                                        ? column.render(document[column.dataIndex as keyof DocumentFileResponse])
                                        : String(document[column.dataIndex as keyof DocumentFileResponse])}
                            </span>
                                ))}
                            </div>
                    ))}
                </div>
        ),
        Upload: ({beforeUpload, customRequest, children}: {
            beforeUpload: (file: File) => boolean;
            customRequest: (options: {
                file: File;
                onSuccess?: (response: unknown) => void;
                onError?: (error: Error) => void;
            }) => void;
            children: ReactNode;
        }) => (
                <div>
                    <button type="button" data-testid="validate-valid" onClick={() => beforeUpload(new File(["pdf"], "valid.pdf", {type: "application/pdf"}))}/>
                    <button type="button" data-testid="validate-invalid" onClick={() => beforeUpload(new File(["txt"], "invalid.txt", {type: "text/plain"}))}/>
                    <button type="button" data-testid="upload-success" onClick={() => customRequest({
                        file: new File(["pdf"], "upload.pdf", {type: "application/pdf"}),
                        onSuccess: jest.fn(),
                        onError: jest.fn()
                    })}/>
                    <button type="button" data-testid="upload-failure" onClick={() => customRequest({
                        file: new File(["pdf"], "upload.pdf", {type: "application/pdf"}),
                        onSuccess: jest.fn(),
                        onError: jest.fn()
                    })}/>
                    {children}
                </div>
        ),
        message: {
            useMessage: () => mockMessageContext
        }
    };
});

const documents: DocumentFileResponse[] = [
    {
        id: 1,
        filename: "jane.pdf",
        filesize: 10,
        mimetype: "application/pdf",
        filechecksum: "one",
        status: UploadStatusEnum.UPLOADED,
        creator: "Doe, Jane",
        createdAt: new Date("2026-01-01T10:00:00Z"),
        url: "/files/1"
    },
    {
        id: 2,
        filename: "john.pdf",
        filesize: 10,
        mimetype: "application/pdf",
        filechecksum: "two",
        status: UploadStatusEnum.UPLOADED,
        creator: "Doe, John",
        createdAt: new Date("2026-01-02T10:00:00Z"),
        url: "/files/2"
    }
];

describe("UserDocumentFiles", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockSession.documentsSupported = true;
        (fileTransferAPI.findAllDocuments as jest.Mock).mockResolvedValue(documents);
        (fileTransferAPI.uploadDocumentFile as jest.Mock).mockResolvedValue({url: "/files/uploaded"});
    });

    it("loads and displays only documents created by the requested user", async () => {
        render(<UserDocumentFiles userId={7} creatorName="Doe, Jane" canUpload={false}/>);

        await waitFor(() => expect(fileTransferAPI.findAllDocuments).toHaveBeenCalledWith(7));
        expect(screen.getByTestId("document-1")).toHaveTextContent("jane.pdf");
        expect(screen.queryByTestId("document-2")).not.toBeInTheDocument();
        expect(screen.getByText("UserFiles.document.download")).toHaveAttribute("href", "/files/1");
    });

    it("does not render or fetch documents when the feature is disabled", () => {
        mockSession.documentsSupported = false;

        const {container} = render(<UserDocumentFiles userId={7} creatorName="Doe, Jane" canUpload/>);

        expect(container.firstChild).toBeNull();
        expect(fileTransferAPI.findAllDocuments).not.toHaveBeenCalled();
    });

    it("reports fetch failures", async () => {
        (fileTransferAPI.findAllDocuments as jest.Mock).mockRejectedValue(new Error("offline"));

        render(<UserDocumentFiles userId={7} creatorName="Doe, Jane" canUpload={false}/>);

        await waitFor(() => expect(mockMessage.error).toHaveBeenCalledWith("UserFiles.document.fetchFail"));
    });

    it("validates uploads and reports successful uploads", async () => {
        render(<UserDocumentFiles userId={7} creatorName="Doe, Jane" canUpload/>);

        fireEvent.click(screen.getByTestId("validate-invalid"));
        expect(mockMessage.error).toHaveBeenCalledWith("UserFiles.document.upload.invalidType");

        fireEvent.click(screen.getByTestId("validate-valid"));
        expect(mockMessage.error).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByTestId("upload-success"));
        await waitFor(() => expect(fileTransferAPI.uploadDocumentFile).toHaveBeenCalled());
        expect(mockMessage.success).toHaveBeenCalledWith("UserFiles.document.upload.success");
    });

    it("reports upload failures", async () => {
        (fileTransferAPI.uploadDocumentFile as jest.Mock).mockRejectedValue(new Error("offline"));

        render(<UserDocumentFiles userId={7} creatorName="Doe, Jane" canUpload/>);
        fireEvent.click(screen.getByTestId("upload-failure"));

        await waitFor(() => expect(mockMessage.error).toHaveBeenCalledWith("UserFiles.document.upload.fail"));
    });
});
