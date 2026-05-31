import {act, fireEvent, render, screen} from "@testing-library/react";
import type {ReactNode} from "react";
import {AdminNotifications} from "../components/Notification/AdminNotifications";
import {UpdateStatusEnum} from "../models";

const mockCreateBulkNotifications = jest.fn();
const mockFindByRole = jest.fn();
const mockResetFields = jest.fn();
const mockSetFieldsValue = jest.fn();
const mockMessageSuccess = jest.fn();
const mockMessageError = jest.fn();

let capturedOnFinish: ((values: { recipients?: number[]; title: string; message: string; sendAll: boolean }) => void) | null = null;
let capturedMessageRules: Array<Record<string, unknown>> = [];

jest.mock("../services", () => ({
    notificationAPI: {
        createBulkNotifications: (...args: unknown[]) => mockCreateBulkNotifications(...args)
    },
    userAPI: {
        findByRole: (...args: unknown[]) => mockFindByRole(...args)
    }
}));

jest.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string) => key
    })
}));

jest.mock("antd", () => {
    const FormMock = ({children, onFinish}: { children: ReactNode; onFinish?: (values: { recipients?: number[]; title: string; message: string; sendAll: boolean }) => void }) => {
        capturedOnFinish = onFinish || null;
        return <div>{children}</div>;
    };

    FormMock.Item = ({
        children,
        name,
        rules
    }: {
        children: ReactNode;
        name?: string;
        rules?: Array<Record<string, unknown>>;
    }) => {
        if (name === "message" && rules) {
            capturedMessageRules = rules;
        }
        return <div>{children}</div>;
    };
    FormMock.useForm = () => [{
        resetFields: mockResetFields,
        setFieldsValue: mockSetFieldsValue
    }];

    const InputMock = ({placeholder}: { placeholder?: string }) => <input placeholder={placeholder}/>;
    InputMock.TextArea = ({placeholder}: { placeholder?: string }) => <textarea placeholder={placeholder}/>;

    return {
        Button: ({children, onClick}: { children: ReactNode; onClick?: () => void }) => (
                <button onClick={onClick}>{children}</button>
        ),
        Checkbox: ({children}: { children: ReactNode }) => <label>{children}</label>,
        Form: FormMock,
        Input: InputMock,
        Select: () => <div/>,
        Space: ({children}: { children: ReactNode }) => <div>{children}</div>,
        Spin: ({children}: { children: ReactNode }) => <div>{children}</div>,
        Typography: {
            Text: ({children}: { children: ReactNode }) => <span>{children}</span>,
            Title: ({children}: { children: ReactNode }) => <h2>{children}</h2>
        },
        message: {
            useMessage: () => [
                {success: mockMessageSuccess, error: mockMessageError},
                <div key={"message-holder"}>message-holder</div>
            ]
        }
    };
});

describe("AdminNotifications", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        capturedOnFinish = null;
        capturedMessageRules = [];
        mockCreateBulkNotifications.mockResolvedValue({status: UpdateStatusEnum.OK});
    });

    it("enforces minimum message length validation rule", () => {
        render(<AdminNotifications participantIds={[10]} embedded={true}/>);

        const minRule = capturedMessageRules.find((rule) => rule.min === 5);
        expect(minRule).toBeDefined();
        expect(minRule?.message).toBe("AdminNotifications.form.message.min");
    });

    it("submits participant payload using sendAll false", async () => {
        const onNotificationSent = jest.fn();
        render(<AdminNotifications participantIds={[10, 20]} embedded={true} onNotificationSent={onNotificationSent}/>);

        await act(async () => {
            capturedOnFinish?.({title: "Bulk title", message: "Valid message", sendAll: false});
            await Promise.resolve();
        });

        expect(mockCreateBulkNotifications).toHaveBeenCalledWith({
            id: 0,
            description: "",
            title: "Bulk title",
            message: "Valid message",
            creator: 0,
            recipients: [10, 20],
            sendAll: false
        });
        expect(onNotificationSent).toHaveBeenCalled();
    });

    it("runs cancel handler without sending notifications", () => {
        const onCancel = jest.fn();
        render(<AdminNotifications participantIds={[10]} embedded={true} onCancel={onCancel}/>);

        fireEvent.click(screen.getByText("common.button.cancel"));
        expect(onCancel).toHaveBeenCalled();
        expect(mockCreateBulkNotifications).not.toHaveBeenCalled();
    });
});
