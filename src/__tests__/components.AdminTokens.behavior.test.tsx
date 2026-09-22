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
    Input.Search = ({placeholder, onSearch}: { placeholder?: string; onSearch?: (value: string) => void }) =>
        <input placeholder={placeholder} onChange={event => onSearch?.(event.target.value)}/>;
    const DatePicker = () => <input/>;
    DatePicker.RangePicker = () => <input/>;
    const Grid = {useBreakpoint: () => ({})};
    const Table = ({dataSource = [], columns = [], onChange}: {
        dataSource?: Array<Record<string, unknown>>;
        columns?: Array<{ render?: (value: unknown, record: Record<string, unknown>) => ReactNode }>;
        onChange?: (...args: unknown[]) => void;
    }) =>
        <div data-testid="token-table"><input placeholder="Search token_value" onChange={event =>
            onChange?.({current: 1, pageSize: 25}, {token_value: event.target.value ? [event.target.value] : null}, {field: "created_at", order: "descend"})
        }/>{dataSource.map(record => <div key={String(record.token_id)}>
            {columns.map((column, index) => <span key={index}>{column.render?.(record.token_value, record)}</span>)}
        </div>)}
            <button onClick={() => onChange?.({current: 2, pageSize: 25}, {}, {field: "expires_at", order: "ascend"})}>table-sort</button>
        </div>;
    const Modal = ({open, children}: { open?: boolean; children: ReactNode }) => open ? <div role="dialog">{children}</div> : null;
    const Popconfirm = ({children, onConfirm}: { children: ReactNode; onConfirm?: () => void }) =>
        <span onClick={onConfirm}>{children}</span>;
    return {
        Button, DatePicker, Form, Grid, Input, Modal, Popconfirm,
        Space: ({children}: { children: ReactNode }) => <span>{children}</span>, Table,
        Switch: ({onChange}: { onChange?: (value: boolean) => void }) => <button onClick={() => onChange?.(true)}>switch</button>,
        Typography: {Text: ({children}: { children: ReactNode }) => <span>{children}</span>},
        message: {useMessage: () => [mockMessage, <span>messages</span>]}
    };
});

describe("AdminTokens behavior", () => {
    const token = {
        token_id: 1, token_value: "token-value", description: "description",
        created_at: "2026-01-01T00:00:00Z", expires_at: "2027-01-01T00:00:00Z"
    };

    const page = (tokens: object[]) =>
        ({content: tokens, page: 0, size: 25, total_elements: tokens.length, total_pages: 1, first: true, last: true, empty: false});

    beforeEach(() => {
        jest.clearAllMocks();
        mockAPI.list.mockResolvedValue(page([token]));
        mockAPI.createToken.mockResolvedValue({...token, token_id: 2});
        mockAPI.refreshToken.mockResolvedValue({...token, expires_at: "2028-01-01T00:00:00Z"});
        mockAPI.invalidateToken.mockResolvedValue(true);
    });

    it("loads a server page, searches, sorts, creates, refreshes, and invalidates tokens", async () => {
        const {container} = render(<AdminTokens/>);
        await waitFor(() => expect(mockAPI.list).toHaveBeenCalledWith({page: 0, size: 25, sort_by: "created_at", direction: "DESC"}));
        await waitFor(() => expect(screen.getByTestId("token-table")).toHaveTextContent("token-value"));

        fireEvent.change(screen.getByPlaceholderText("Search token_value"), {target: {value: "deploy"}});
        await waitFor(() => expect(mockAPI.list).toHaveBeenLastCalledWith({
            page: 0, size: 25, sort_by: "created_at", direction: "DESC", search: "deploy", case_sensitive: false, filter_column: "token_value"
        }));
        fireEvent.click(screen.getByText("table-sort"));
        await waitFor(() => expect(mockAPI.list).toHaveBeenLastCalledWith(expect.objectContaining({page: 0, sort_by: "expires_at", direction: "ASC"})));

        fireEvent.click(screen.getAllByText("AdminTokens.actions.create")[0]);
        fireEvent.submit(container.querySelectorAll("form")[0]);
        await waitFor(() => expect(mockAPI.createToken).toHaveBeenCalledWith({
            expires_at: dayjs("2027-01-01").toISOString(), description: "description"
        }));

        fireEvent.click(screen.getAllByText("AdminTokens.actions.refresh")[0]);
        fireEvent.submit(container.querySelectorAll("form")[0]);
        await waitFor(() => expect(mockAPI.refreshToken).toHaveBeenCalledWith({token_value: "token-value", days: 30}));

        fireEvent.click(screen.getByText("AdminTokens.actions.invalidate"));
        await waitFor(() => expect(mockAPI.invalidateToken).toHaveBeenCalledWith("token-value"));
    });

    it("reports a failed page load with a translated message", async () => {
        const error = new Error("service unavailable");
        mockAPI.list.mockRejectedValue(error);
        const consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined);
        render(<AdminTokens/>);
        await waitFor(() => expect(mockMessage.error).toHaveBeenCalledWith("common.table.loadError"));
        expect(mockMessage.error).not.toHaveBeenCalledWith("service unavailable");
        consoleError.mockRestore();
    });

    it("reports refresh and invalidation failures and supports manual reload", async () => {
        mockAPI.refreshToken.mockRejectedValue(new Error("refresh unavailable"));
        mockAPI.invalidateToken.mockRejectedValue(new Error("invalidate unavailable"));
        const {container} = render(<AdminTokens/>);
        await waitFor(() => expect(mockAPI.list).toHaveBeenCalled());
        fireEvent.click(screen.getByText("AdminTokens.actions.reload"));
        await waitFor(() => expect(mockAPI.list.mock.calls.length).toBeGreaterThanOrEqual(2));

        fireEvent.click(screen.getByText("AdminTokens.actions.refresh"));
        fireEvent.submit(container.querySelectorAll("form")[0]);
        await waitFor(() => expect(mockMessage.error).toHaveBeenCalledWith("refresh unavailable"));

        fireEvent.click(screen.getByText("AdminTokens.actions.invalidate"));
        await waitFor(() => expect(mockMessage.error).toHaveBeenCalledWith("invalidate unavailable"));
    });
});
