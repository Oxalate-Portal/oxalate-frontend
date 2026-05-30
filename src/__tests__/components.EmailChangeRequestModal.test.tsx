import {act, fireEvent, render, screen} from "@testing-library/react";
import type {ReactNode} from "react";
import {EmailChangeRequestModal} from "../components/User/EmailChangeRequestModal";

const mockRequestEmailChange = jest.fn();
const mockFormApi = {
    setFieldsValue: jest.fn(),
    resetFields: jest.fn()
};

let capturedOnFinish: ((values: { newEmail: string; password: string }) => void) | null = null;

jest.mock("../services", () => ({
    authAPI: {
        requestEmailChange: (...args: unknown[]) => mockRequestEmailChange(...args)
    }
}));

jest.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string) => key
    })
}));

jest.mock("antd", () => {
    const FormMock = ({children, onFinish}: { children: ReactNode; onFinish?: (values: { newEmail: string; password: string }) => void }) => {
        capturedOnFinish = onFinish || null;
        return <div>{children}</div>;
    };

    FormMock.Item = ({children}: { children: ReactNode }) => <div>{children}</div>;
    FormMock.useForm = () => [mockFormApi];

    const InputMock = ({placeholder}: { placeholder?: string }) => <input placeholder={placeholder}/>;
    InputMock.Password = ({placeholder}: { placeholder?: string }) => <input placeholder={placeholder} type="password"/>;

    return {
        Alert: ({message, title}: { message?: string; title?: string }) => <div>{title ?? message}</div>,
        Button: ({children, onClick}: { children: ReactNode; onClick?: () => void }) => <button onClick={onClick}>{children}</button>,
        Form: FormMock,
        Input: InputMock,
        Modal: ({open, children, title, onCancel}: {
            open: boolean;
            children: ReactNode;
            title: ReactNode;
            onCancel: () => void;
        }) => open ? (
                <div>
                    <h1>{title}</h1>
                    <button onClick={onCancel}>modal-cancel</button>
                    {children}
                </div>
        ) : null,
        Space: ({children}: { children: ReactNode }) => <div>{children}</div>
    };
});

describe("EmailChangeRequestModal", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        capturedOnFinish = null;
    });

    it("hides the form after successful request and shows close action", async () => {
        const onClose = jest.fn();
        mockRequestEmailChange.mockResolvedValue(true);

        render(<EmailChangeRequestModal open={true} onClose={onClose}/>);

        expect(screen.getByText("User.emailChange.form.submit")).toBeInTheDocument();

        await act(async () => {
            capturedOnFinish?.({newEmail: "new.user@example.com", password: "ValidPassword1!"});
            await Promise.resolve();
        });

        expect(mockRequestEmailChange).toHaveBeenCalledWith({newEmail: "new.user@example.com", password: "ValidPassword1!"});
        expect(mockFormApi.setFieldsValue).toHaveBeenCalledWith({password: ""});
        expect(screen.getByText("User.emailChange.result.success")).toBeInTheDocument();
        expect(screen.queryByText("User.emailChange.form.submit")).toBeNull();
        expect(screen.getByText("common.button.close")).toBeInTheDocument();

        fireEvent.click(screen.getByText("common.button.close"));
        expect(mockFormApi.resetFields).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
    });

    it("keeps form visible when backend rejects request", async () => {
        mockRequestEmailChange.mockResolvedValue(false);

        render(<EmailChangeRequestModal open={true} onClose={() => undefined}/>);

        await act(async () => {
            capturedOnFinish?.({newEmail: "taken@example.com", password: "WrongPassword1!"});
            await Promise.resolve();
        });

        expect(screen.getByText("User.emailChange.result.fail")).toBeInTheDocument();
        expect(screen.getByText("User.emailChange.form.submit")).toBeInTheDocument();
    });

    it("shows failure state when request call throws", async () => {
        const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
        mockRequestEmailChange.mockRejectedValue(new Error("network"));

        render(<EmailChangeRequestModal open={true} onClose={() => undefined}/>);

        await act(async () => {
            capturedOnFinish?.({newEmail: "new.user@example.com", password: "ValidPassword1!"});
            await Promise.resolve();
        });

        expect(screen.getByText("User.emailChange.result.fail")).toBeInTheDocument();
        expect(consoleErrorSpy).toHaveBeenCalled();
    });
});


