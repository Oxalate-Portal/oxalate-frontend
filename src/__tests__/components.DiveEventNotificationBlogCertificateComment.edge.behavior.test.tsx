import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import type {ReactNode} from "react";
import {AdminNotifications} from "../components/Notification/AdminNotifications";
import {NotificationDropdown} from "../components/Notification/NotificationDropdown";
import {CommentModerationActions} from "../components/Commenting/CommentModerationActions";
import {NotificationGroupEnum, UpdateStatusEnum} from "../models";

let formFinish: ((values: never) => void) | undefined;
const mockMessageApi = {success: jest.fn(), error: jest.fn()};

jest.mock("../services", () => ({
    notificationAPI: {getUnreadNotifications: jest.fn(), markNotificationsAsRead: jest.fn(), createBulkNotifications: jest.fn()},
    userAPI: {findByRole: jest.fn()},
    commentAPI: {rejectComment: jest.fn(), rejectReports: jest.fn()}
}));
const mockApi = jest.requireMock("../services") as typeof import("../services");
const stableTranslation = {t: (key: string) => key};
jest.mock("react-i18next", () => ({useTranslation: () => stableTranslation}));
jest.mock("react-router-dom", () => ({
    NavLink: ({children}: { children: ReactNode }) => <a href="/notifications">{children}</a>
}));
jest.mock("antd", () => {
    const passthrough = ({children, onClick, ...props}: { children?: ReactNode; onClick?: () => void; [key: string]: unknown }) =>
            <div onClick={onClick} {...Object.fromEntries(Object.entries(props).filter(([k]) => k === "data-testid"))}>{children}</div>;
    const Form = ({children, onFinish}: { children: ReactNode; onFinish?: (values: never) => void }) => {
        formFinish = onFinish;
        return <form onSubmit={event => {
            event.preventDefault();
            onFinish?.({} as never);
        }}>{children}</form>;
    };
    Form.useForm = () => [{resetFields: jest.fn(), setFieldsValue: jest.fn()}];
    Form.Item = ({children}: { children: ReactNode }) => <div>{children}</div>;
    const Button = ({children, onClick, htmlType, disabled}: { children: ReactNode; onClick?: () => void; htmlType?: string; disabled?: boolean }) =>
            <button type={htmlType === "submit" ? "submit" : "button"} onClick={onClick} disabled={disabled}>{children}</button>;
    const Input = (props: Record<string, unknown>) => <input {...props}/>;
    Input.TextArea = Input;
    const Select = ({options = [], onChange, placeholder}: {
        options?: { value: string; label: string }[];
        onChange?: (value: string) => void;
        placeholder?: string
    }) =>
            <select aria-label={placeholder} onChange={event => onChange?.(event.target.value)}>{options.map(option => <option key={option.value}
                                                                                                                               value={option.value}>{option.label}</option>)}</select>;
    const Radio = ({children}: { children: ReactNode }) => <label>{children}</label>;
    Radio.Group = ({children}: { children: ReactNode }) => <div>{children}</div>;
    const Modal = ({open, children, onCancel, footer}: { open?: boolean; children?: ReactNode; onCancel?: () => void; footer?: ReactNode }) =>
            open ? <div role="dialog">{children}{footer}
                <button onClick={onCancel}>cancel-modal</button>
            </div> : null;
    const Dropdown = ({children, popupRender, onOpenChange}: { children: ReactNode; popupRender: () => ReactNode; onOpenChange: (open: boolean) => void }) =>
            <div>
                <button aria-label="notifications" onClick={() => onOpenChange(true)}>{children}</button>
                {popupRender()}</div>;
    const List = ({dataSource, renderItem}: { dataSource: never[]; renderItem: (item: never, index: number) => ReactNode }) =>
            <div>{dataSource.map((item, index) => renderItem(item, index))}</div>;
    List.Item = ({children, onClick}: { children: ReactNode; onClick?: () => void }) => <div onClick={onClick}>{children}</div>;
    List.Item.Meta = ({title, description}: { title: ReactNode; description: ReactNode }) => <div>{title}{description}</div>;
    return {
        Alert: passthrough, Badge: passthrough, Button, Card: passthrough, Col: passthrough, Empty: passthrough,
        Form, Input, InputNumber: Input, List, Modal, Radio,
        Select, Space: passthrough, Spin: passthrough, Table: passthrough, Typography: {Title: passthrough, Text: passthrough, Paragraph: passthrough},
        Dropdown, message: {useMessage: () => [mockMessageApi, <span key="message-context"/>]},
        DatePicker: passthrough
    };
});

beforeEach(() => {
    jest.clearAllMocks();
    formFinish = undefined;
    mockApi.notificationAPI.getUnreadNotifications.mockResolvedValue([]);
    mockApi.notificationAPI.markNotificationsAsRead.mockResolvedValue({});
    mockApi.notificationAPI.createBulkNotifications.mockResolvedValue({status: UpdateStatusEnum.OK});
    mockApi.userAPI.findByRole.mockResolvedValue([{id: 4, name: "Diver"}]);
    mockApi.commentAPI.rejectComment.mockResolvedValue({});
    mockApi.commentAPI.rejectReports.mockResolvedValue({});
});

describe("notification and moderation edge paths", () => {
    it("validates every admin notification mode and sends participant messages", async () => {
        const sent = jest.fn();
        render(<AdminNotifications onNotificationSent={sent}/>);
        await waitFor(() => expect(mockApi.userAPI.findByRole).toHaveBeenCalled());
        formFinish!({title: "t", message: "message", notificationMode: "recipients"} as never);
        expect(mockMessageApi.error).toHaveBeenCalledWith("AdminNotifications.errorNoRecipients");
        formFinish!({title: "t", message: "message", notificationMode: "group", notificationGroup: NotificationGroupEnum.INACTIVE_DAYS} as never);
        expect(mockMessageApi.error).toHaveBeenCalledWith("AdminNotifications.errorNoInactiveDays");
        formFinish!({title: "t", message: "message", notificationMode: "sendAll"} as never);
        await waitFor(() => expect(mockApi.notificationAPI.createBulkNotifications).toHaveBeenCalledWith(expect.objectContaining({sendAll: true})));
        render(<AdminNotifications participantIds={[2, 3]} onNotificationSent={sent} embedded/>);
        formFinish!({title: "event", message: "hello"} as never);
        await waitFor(() => expect(mockApi.notificationAPI.createBulkNotifications).toHaveBeenCalledWith(expect.objectContaining({
            recipients: [2, 3],
            sendAll: false
        })));
        expect(sent).toHaveBeenCalled();
        mockApi.notificationAPI.createBulkNotifications.mockResolvedValueOnce({status: UpdateStatusEnum.FAIL, message: "bad"});
        formFinish!({title: "event", message: "hello"} as never);
        await waitFor(() => expect(mockMessageApi.error).toHaveBeenCalledWith("AdminNotifications.error bad"));
    });

    it("covers notification read failure, navigation controls, and moderation failures", async () => {
        const notices = [{id: 1, title: "one", message: "long message", createdAt: "2024-01-01"}, {
            id: 2,
            title: "two",
            message: "two",
            createdAt: "2024-01-01"
        }];
        mockApi.notificationAPI.getUnreadNotifications.mockResolvedValueOnce(notices);
        mockApi.notificationAPI.markNotificationsAsRead.mockRejectedValueOnce(new Error("offline"));
        render(<NotificationDropdown pollInterval={100000}/>);
        await waitFor(() => expect(screen.getByText("one")).toBeInTheDocument());
        fireEvent.click(screen.getByText("one"));
        await waitFor(() => expect(mockApi.notificationAPI.markNotificationsAsRead).toHaveBeenCalledWith({messageIds: [1]}));
        window.confirm = jest.fn(() => true);
        const refresh = jest.fn();
        render(<CommentModerationActions commentId={7} childCount={1} refreshModerationList={refresh}/>);
        fireEvent.click(screen.getByText("CommentModerationActions.button.reject-comment"));
        fireEvent.click(screen.getByText("CommentModerationActions.button.dismiss-reports"));
        await waitFor(() => expect(mockApi.commentAPI.rejectComment).toHaveBeenCalledWith(7));
        expect(mockApi.commentAPI.rejectReports).toHaveBeenCalledWith(7);
        mockApi.commentAPI.rejectComment.mockRejectedValueOnce(new Error("reject"));
        mockApi.commentAPI.rejectReports.mockRejectedValueOnce(new Error("dismiss"));
        fireEvent.click(screen.getByText("CommentModerationActions.button.reject-comment"));
        fireEvent.click(screen.getByText("CommentModerationActions.button.dismiss-reports"));
        await waitFor(() => expect(mockApi.commentAPI.rejectReports).toHaveBeenCalledTimes(2));
        expect(refresh).toHaveBeenCalled();
    });
});
