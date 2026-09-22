import {render, screen, waitFor} from "@testing-library/react";
import type {ReactNode} from "react";
import {DiveFiles, DocumentFiles} from "../components";
import {fileTransferAPI} from "../services";
import {UploadStatusEnum} from "../models";

const mockSession = {
    documentsSupported: true,
    diveFilesSupported: true
};

jest.mock("react-i18next", () => ({
    useTranslation: () => ({t: (key: string) => key})
}));

jest.mock("../session", () => ({
    useSession: () => ({
        userSession: {access_token: "token"},
        getPortalConfigurationValue: (_group: string, key: string) =>
            key === "documents-supported"
                ? String(mockSession.documentsSupported)
                : String(mockSession.diveFilesSupported)
    })
}));

jest.mock("../services", () => ({
    getApiBaseUrl: () => "http://api",
    fileTransferAPI: {
        findAllDocuments: jest.fn(),
        findAllDiveFiles: jest.fn(),
        removeDocumentFile: jest.fn()
    }
}));

jest.mock("antd", () => ({
    Grid: {useBreakpoint: () => ({})},
    Input: {Search: ({placeholder}: { placeholder?: string }) => <input placeholder={placeholder}/>},
    Switch: () => <button>switch</button>,
    Button: ({children}: { children: ReactNode }) => <button>{children}</button>,
    Space: ({children}: { children: ReactNode }) => <div>{children}</div>,
    Table: ({dataSource}: { dataSource: Array<Record<string, unknown>> }) => (
        <div data-testid="file-table">
            {dataSource.map(file => <div key={String(file.id)}>{String(file.filename)}</div>)}
        </div>
    ),
    Typography: {
        Text: ({children}: { children: ReactNode }) => <span>{children}</span>
    },
    Upload: ({children}: { children: ReactNode }) => <div>{children}</div>,
    message: {
        useMessage: () => [{success: jest.fn(), error: jest.fn()}, <span key="message-holder"/>]
    }
}));

/** Wraps rows in the page envelope the server-paged list endpoints return. */
const mockPage = <T, >(rows: T[]) => ({
    content: rows,
    page: 0,
    size: 10,
    total_elements: rows.length,
    total_pages: 1,
    first: true,
    last: true,
    empty: rows.length === 0
});

describe("file upload configuration components", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockSession.documentsSupported = true;
        mockSession.diveFilesSupported = true;
        (fileTransferAPI.findAllDocuments as jest.Mock).mockResolvedValue(mockPage([
            {id: 1, filename: "document.pdf", status: UploadStatusEnum.UPLOADED}
        ]));
        (fileTransferAPI.findAllDiveFiles as jest.Mock).mockResolvedValue(mockPage([
            {id: 2, filename: "dive.pdf", status: UploadStatusEnum.UPLOADED}
        ]));
    });

    it("loads configured document and dive file lists", async () => {
        render(<><DocumentFiles/><DiveFiles/></>);

        await waitFor(() => {
            expect(fileTransferAPI.findAllDocuments).toHaveBeenCalled();
            expect(fileTransferAPI.findAllDiveFiles).toHaveBeenCalled();
        });
        expect(screen.getByText("document.pdf")).toBeInTheDocument();
        expect(screen.getByText("dive.pdf")).toBeInTheDocument();
    });

    it("does not render or fetch disabled file types", () => {
        mockSession.documentsSupported = false;
        mockSession.diveFilesSupported = false;

        const {container} = render(<><DocumentFiles/><DiveFiles/></>);

        expect(container).toBeEmptyDOMElement();
        expect(fileTransferAPI.findAllDocuments).not.toHaveBeenCalled();
        expect(fileTransferAPI.findAllDiveFiles).not.toHaveBeenCalled();
    });
});
