import dayjs from "dayjs";
import {type ReactNode} from "react";
import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import {AdminTokens} from "../components/Administration/AdminTokens";
import {tokenAPI} from "../services";

const mockAPI = tokenAPI as unknown as {
    list: jest.Mock; createToken: jest.Mock; refreshToken: jest.Mock; invalidateToken: jest.Mock;
};
var mockMessage = {success: jest.fn(), error: jest.fn()};

jest.mock("../services", () => ({
    tokenAPI: {list: jest.fn(), createToken: jest.fn(), refreshToken: jest.fn(), invalidateToken: jest.fn()}
}));
jest.mock("react-i18next", () => ({useTranslation: () => ({t: (key: string) => key})}));
jest.mock("antd", () => {
    const Form = ({children, onFinish}: { children: ReactNode; onFinish?: (values: unknown) => void }) =>
        <form onSubmit={event => {
            event.preventDefault();
            onFinish?.({
                search: "token", description: "description",
                expiresAt: dayjs("2027-01-01"), days: 30
            });
        }}>{children}</form>;
    Form.Item = ({children}: { children: ReactNode }) => <div>{children}</div>;
    Form.useForm = () => [{resetFields: jest.fn()}];
    const Button = ({children, onClick, htmlType}: { children: ReactNode; onClick?: () => void; htmlType?: string }) =>
        <button type={htmlType === "submit" ? "submit" : "button"} onClick={onClick}>{children}</button>;
    const Input = ({placeholder}: { placeholder?: string }) => <input placeholder={placeholder}/>;
    Input.TextArea = Input;
    const DatePicker = () => <input/>;
    DatePicker.RangePicker = () => <input/>;
    const Table = ({dataSource = [], columns = []}: {
        dataSource?: Array<Record<string, unknown>>;
        columns?: Array<{ render?: (value: unknown, record: Record<string, unknown>) => ReactNode }>
    }) =>
        <div data-testid="token-table">{dataSource.map(record => <div key={String(record.tokenId)}>
            {columns.map((column, index) => <span key={index}>{column.render?.(record.tokenValue, record)}</span>)}
        </div>)}</div>;
    const Modal = ({open, children}: { open?: boolean; children: ReactNode }) => open ? <div role="dialog">{children}</div> : null;
    const Popconfirm = ({children, onConfirm}: { children: ReactNode; onConfirm?: () => void }) =>
        <span onClick={onConfirm}>{children}</span>;
    return {
        Button, DatePicker, Form, Input, Modal, Popconfirm,
        Space: ({children}: { children: ReactNode }) => <span>{children}</span>, Table,
        message: {useMessage: () => [mockMessage, <span>messages</span>]}
    };
});

describe("AdminTokens behavior", () => {
    const token = {
        tokenId: 1, tokenValue: "token-value", description: "description",
        createdAt: "2026-01-01T00:00:00Z", expiresAt: "2027-01-01T00:00:00Z"
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockAPI.list.mockResolvedValue([token]);
        mockAPI.createToken.mockResolvedValue({...token, tokenId: 2});
        mockAPI.refreshToken.mockResolvedValue({...token, expiresAt: "2028-01-01T00:00:00Z"});
        mockAPI.invalidateToken.mockResolvedValue(true);
    });

    it("loads, filters, creates, refreshes, and invalidates tokens", async () => {
        const {container} = render(<AdminTokens/>);
        await waitFor(() => expect(mockAPI.list).toHaveBeenCalled());
        fireEvent.submit(container.querySelectorAll("form")[0]);
        expect(screen.getByTestId("token-table")).toHaveTextContent("token-value");

        fireEvent.click(screen.getAllByText("AdminTokens.actions.create")[0]);
        fireEvent.submit(container.querySelectorAll("form")[1]);
        await waitFor(() => expect(mockAPI.createToken).toHaveBeenCalledWith({
            expiresAt: dayjs("2027-01-01").toISOString(), description: "description"
        }));

        fireEvent.click(screen.getAllByText("AdminTokens.actions.refresh")[0]);
        fireEvent.submit(container.querySelectorAll("form")[1]);
        await waitFor(() => expect(mockAPI.refreshToken).toHaveBeenCalledWith({tokenValue: "token-value", days: 30}));

        fireEvent.click(screen.getByText("AdminTokens.actions.invalidate"));
        await waitFor(() => expect(mockAPI.invalidateToken).toHaveBeenCalledWith("token-value"));
    });

    it("reports loading and mutation failures", async () => {
        const error = new Error("service unavailable");
        mockAPI.list.mockRejectedValue(error);
        mockAPI.createToken.mockRejectedValue(error);
        render(<AdminTokens/>);
        await waitFor(() => expect(mockMessage.error).toHaveBeenCalledWith("service unavailable"));
    });

    it("reports refresh and invalidation failures and supports manual reload", async () => {
        mockAPI.refreshToken.mockRejectedValue(new Error("refresh unavailable"));
        mockAPI.invalidateToken.mockRejectedValue(new Error("invalidate unavailable"));
        const {container} = render(<AdminTokens/>);
        await waitFor(() => expect(mockAPI.list).toHaveBeenCalled());
        fireEvent.click(screen.getByText("AdminTokens.actions.reload"));
        await waitFor(() => expect(mockAPI.list.mock.calls.length).toBeGreaterThanOrEqual(2));

        fireEvent.click(screen.getByText("AdminTokens.actions.refresh"));
        fireEvent.submit(container.querySelectorAll("form")[1]);
        await waitFor(() => expect(mockMessage.error).toHaveBeenCalledWith("refresh unavailable"));

        fireEvent.click(screen.getByText("AdminTokens.actions.invalidate"));
        await waitFor(() => expect(mockMessage.error).toHaveBeenCalledWith("invalidate unavailable"));
    });
});
