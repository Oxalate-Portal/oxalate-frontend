import React, {type ReactNode} from "react";
import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import {DiveEventFiles} from "../components";
import {fileTransferAPI} from "../services";

const mockSession = {
    enabled: true,
    roles: ["ROLE_USER"]
};
const mockMessage = {success: jest.fn(), error: jest.fn()};
const mockMessageContext = [mockMessage, React.createElement("span", {key: "message-holder"})] as const;
const translate = (key: string) => key;

jest.mock("react-i18next", () => ({
    useTranslation: () => ({t: translate})
}));

jest.mock("../session", () => ({
    useSession: () => ({
        userSession: {roles: mockSession.roles},
        getPortalConfigurationValue: () => String(mockSession.enabled)
    })
}));

jest.mock("../tools", () => ({
    FileUploadValidationError: {INVALID_TYPE: "INVALID_TYPE", FILE_TOO_LARGE: "FILE_TOO_LARGE"},
    checkRoles: (roles: string[], requiredRoles: string[]) =>
        roles.some(role => requiredRoles.includes(role)),
    validateUploadFile: (file: Pick<File, "name" | "size" | "type">) =>
        file.type === "application/pdf" || file.name.endsWith(".pdf")
            ? {valid: true}
            : {valid: false, error: "INVALID_TYPE"}
}));

jest.mock("../services", () => ({
    fileTransferAPI: {
        findAllDiveFiles: jest.fn(),
        uploadDiveFile: jest.fn()
    }
}));

jest.mock("antd", () => ({
    Button: ({children}: { children: ReactNode }) => React.createElement("button", null, children),
    InputNumber: ({value, onChange}: { value: number; onChange: (value: number) => void }) => (
        React.createElement("input", {
            "aria-label": "dive-group-id",
            type: "number",
            value,
            onChange: (event: React.ChangeEvent<HTMLInputElement>) => onChange(Number(event.target.value))
        })
    ),
    Space: ({children}: { children: ReactNode }) => React.createElement("div", null, children),
    Table: ({dataSource}: { dataSource: Array<Record<string, unknown>> }) => (
        React.createElement("div", {"data-testid": "dive-file-table"},
            dataSource.map(file => React.createElement("div", {key: String(file.id)}, String(file.filename)))
        )
    ),
    Typography: {
        Title: ({children}: { children: ReactNode }) => React.createElement("h2", null, children),
        Text: ({children}: { children: ReactNode }) => React.createElement("span", null, children)
    },
    Upload: ({children, beforeUpload, customRequest}: {
        children: ReactNode;
        beforeUpload: (file: File) => boolean;
        customRequest: (options: { file: File; onSuccess?: (response: unknown) => void; onError?: (error: Error) => void }) => void;
    }) => React.createElement("div", null,
        React.createElement("button", {
            type: "button",
            onClick: () => beforeUpload(new File(["bad"], "bad.txt", {type: "text/plain"}))
        }, "invalid-upload"),
        React.createElement("button", {
            type: "button",
            onClick: () => customRequest({
                file: new File(["dive"], "dive.pdf", {type: "application/pdf"}),
                onSuccess: jest.fn(),
                onError: jest.fn()
            })
        }, "upload-file"),
        children
    ),
    message: {
        useMessage: () => mockMessageContext
    }
}));

describe("DiveEventFiles", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockSession.enabled = true;
        mockSession.roles = ["ROLE_USER"];
        (fileTransferAPI.findAllDiveFiles as jest.Mock).mockResolvedValue([
            {id: 1, eventId: 12, filename: "matching.pdf"},
            {id: 2, eventId: 99, filename: "other.pdf"}
        ]);
        (fileTransferAPI.uploadDiveFile as jest.Mock).mockResolvedValue({url: "/files/dive"});
    });

    it("loads only files belonging to the requested event", async () => {
        render(React.createElement(DiveEventFiles, {eventId: 12}));

        await waitFor(() => expect(fileTransferAPI.findAllDiveFiles).toHaveBeenCalled());
        expect(screen.getByText("matching.pdf")).toBeInTheDocument();
        expect(screen.queryByText("other.pdf")).not.toBeInTheDocument();
        expect(screen.getByLabelText("dive-group-id")).toBeInTheDocument();
    });

    it("validates and uploads dive files", async () => {
        render(React.createElement(DiveEventFiles, {eventId: 12}));

        fireEvent.click(screen.getByText("invalid-upload"));
        expect(mockMessage.error).toHaveBeenCalledWith("UserFiles.dive.upload.invalidType");

        fireEvent.click(screen.getByText("upload-file"));
        await waitFor(() => expect(fileTransferAPI.uploadDiveFile).toHaveBeenCalledWith(
            expect.any(File),
            12,
            1
        ));
        expect(mockMessage.success).toHaveBeenCalledWith("UserFiles.dive.upload.success");
    });

    it("does not render or fetch when dive files are disabled", () => {
        mockSession.enabled = false;

        const {container} = render(React.createElement(DiveEventFiles, {eventId: 12}));

        expect(container.firstChild).toBeNull();
        expect(fileTransferAPI.findAllDiveFiles).not.toHaveBeenCalled();
    });
});
