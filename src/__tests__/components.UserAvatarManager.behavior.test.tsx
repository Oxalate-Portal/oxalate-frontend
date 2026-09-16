import {act, render} from "@testing-library/react";
import {FileUploadValidationError, validateUploadFile} from "../tools";
import {UserAvatarManager} from "../components/User/UserAvatarManager";

const mockUploadProps: { beforeUpload?: (file: unknown) => boolean; onChange?: (info: unknown) => void } = {};
const mockMessage = {success: jest.fn(), error: jest.fn()};
const mockRefreshUserSession = jest.fn();

jest.mock("../tools", () => ({
    ...jest.requireActual("../tools"),
    validateUploadFile: jest.fn()
}));
jest.mock("../session", () => ({
    useSession: () => ({
        userSession: {id: 4, avatarUrl: null},
        refreshUserSession: mockRefreshUserSession
    })
}));
jest.mock("../services", () => ({getApiBaseUrl: () => "https://api.example"}));
jest.mock("../components/main", () => ({
    ProtectedImage: ({imageUrl, alt}: { imageUrl: string; alt: string }) => <img src={imageUrl} alt={alt}/>
}));
jest.mock("react-i18next", () => ({useTranslation: () => ({t: (key: string) => key})}));
jest.mock("antd", () => ({
    Avatar: () => <span data-testid="avatar-placeholder"/>,
    Button: ({children}: { children: React.ReactNode }) => <button>{children}</button>,
    Space: ({children}: { children: React.ReactNode }) => <div>{children}</div>,
    Upload: ({children, ...props}: { children: React.ReactNode; beforeUpload?: (file: unknown) => boolean; onChange?: (info: unknown) => void }) => {
        Object.assign(mockUploadProps, props);
        return <div>{children}</div>;
    },
    message: {useMessage: () => [mockMessage, null]}
}));

describe("UserAvatarManager upload behavior", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (validateUploadFile as jest.Mock).mockReturnValue({valid: true});
    });

    it("validates avatar files and reports both validation failures", () => {
        render(<UserAvatarManager userId={4} initialAvatarUrl={null}/>);

        (validateUploadFile as jest.Mock).mockReturnValue({valid: false, error: FileUploadValidationError.INVALID_TYPE});
        expect(mockUploadProps.beforeUpload?.({})).toBe(false);
        expect(mockMessage.error).toHaveBeenCalledWith("UserFiles.avatar.upload.invalidType");

        (validateUploadFile as jest.Mock).mockReturnValue({valid: false, error: FileUploadValidationError.FILE_TOO_LARGE});
        expect(mockUploadProps.beforeUpload?.({})).toBe(false);
        expect(mockMessage.error).toHaveBeenCalledWith("UserFiles.avatar.upload.fileTooLarge");
        expect(validateUploadFile).toHaveBeenCalledTimes(2);
    });

    it("updates the session after a successful upload and handles response failures", () => {
        const {container} = render(<UserAvatarManager userId={4} initialAvatarUrl="/old.png"/>);

        expect(container.querySelector("img")?.getAttribute("src")).toBe("/old.png");
        expect(mockUploadProps.beforeUpload?.({})).toBe(true);
        act(() => mockUploadProps.onChange?.({file: {status: "done", response: {url: "/new.png"}}}));
        expect(mockRefreshUserSession).toHaveBeenCalledWith({id: 4, avatarUrl: "/new.png"});
        expect(mockMessage.success).toHaveBeenCalledWith("UserFiles.avatar.upload.success");

        act(() => mockUploadProps.onChange?.({file: {status: "done", response: {error: {message: "Rejected"}}}));
        expect(mockMessage.error).toHaveBeenCalledWith("Rejected");
        act(() => mockUploadProps.onChange?.({file: {status: "done", response: {}}}));
        expect(mockMessage.error).toHaveBeenCalledWith("UserFiles.avatar.upload.fail");
        act(() => mockUploadProps.onChange?.({file: {status: "error"}}));
        expect(mockMessage.error).toHaveBeenCalledWith("UserFiles.avatar.upload.fail");
    })
        ;
    });
