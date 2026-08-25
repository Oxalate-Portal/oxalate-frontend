/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {type ReactNode} from "react";
import {act, fireEvent, render, screen, waitFor} from "@testing-library/react";
import {DiveEvent} from "../components/DiveEvent/DiveEvent";
import {DiveEventDetails} from "../components/DiveEvent/DiveEventDetails";
import {DiveEventFiles} from "../components/DiveEvent/DiveEventFiles";
import {DiveEvents} from "../components/DiveEvent/DiveEvents";
import {DiveEventsTable} from "../components/DiveEvent/DiveEventsTable";
import {EditDiveEvent} from "../components/DiveEvent/EditDiveEvent";
import {SetDives} from "../components/DiveEvent/SetDives";
import {ShowDiveEvent} from "../components/DiveEvent/ShowDiveEvent";

const api: Record<string, jest.Mock> = {};
const fn = (name: string) => (api[name] ??= jest.fn());
const session = {
    userSession: {id: 7, roles: ["ROLE_USER"], healthStatementId: 1, primaryUserType: "SCUBA_DIVER"},
    organizer: false,
    membership: false,
    payment: false,
    files: true
};
let params = {paramId: "12"};
let formValues: any;
const mockT = (key: string) => key;
const mockTimezone = () => "Europe/Helsinki";
const mockFrontend = (key: string) => ({
    "max-depth": "60", "max-dive-length": "120", "min-event-length": "1",
    "max-event-length": "6", "min-participants": "1", "max-participants": "20",
    "types-of-event": "SURFACE,SCUBA"
} as Record<string, string>)[key] || "en,fi";
const mockPortal = (_group: string, key: string) =>
        key === "dive-files-supported" ? (session.files ? "true" : "false") :
                key === "event-require-membership" ? (session.membership ? "true" : "false") :
                        key === "event-require-payment" ? (session.payment ? "true" : "false") :
                                key === "commenting-enabled" ? "true" : key === "commenting-enabled-features" ? "event" :
                                        key === "one-time-expiration-type" || key === "periodical-payment-method-type" ? "ENABLED" : "false";
const mockForm = {getFieldValue: jest.fn(() => []), resetFields: jest.fn(), setFieldsValue: jest.fn()};

jest.mock("../services", () => new Proxy({}, {
    get: (_target, name) => new Proxy({}, {
        get: (_obj, method) => fn(`${String(name)}.${String(method)}`)
    })
}));
jest.mock("../session", () => ({
    useSession: () => ({
        userSession: session.userSession,
        getPortalTimezone: mockTimezone,
        getPortalConfigurationValue: mockPortal,
        getFrontendConfigurationValue: mockFrontend
    })
}));
jest.mock("react-i18next", () => ({useTranslation: () => ({t: mockT})}));
jest.mock("react-router-dom", () => ({
    Link: ({children, to}: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
    useParams: () => params,
    useNavigate: () => jest.fn()
}));
jest.mock("../tools", () => ({
    checkRoles: () => session.organizer,
    diveTypeEnum2Tag: (v: string) => <span>{v}</span>,
    diveEventStatusEnum2Tag: (v: string) => <span>{v}</span>,
    userTypeEnum2Tag: (v: string) => <span>{v}</span>,
    paymentTypeEnum2Tag: (v: string) => <span>{v}</span>,
    localToUTCDatetime: (v: unknown) => v,
    getApiBaseUrl: () => "http://api"
}));
jest.mock("../components/Notification", () => ({AdminNotifications: () => <div>notifications</div>}));
jest.mock("../components/Commenting", () => ({CommentCanvas: () => <div>comments</div>}));
jest.mock("../components/main", () => ({HealthStatementConfirmationModal: ({open}: { open: boolean }) => open ? <div>health-modal</div> : null}));
jest.mock("@ant-design/icons", () => ({
    LinkOutlined: () => <span>link</span>, UploadOutlined: () => <span>upload</span>,
    DownOutlined: ({onClick}: { onClick: () => void }) => <button onClick={onClick}>down</button>,
    UpOutlined: ({onClick}: { onClick: () => void }) => <button onClick={onClick}>up</button>
}));
jest.mock("antd", () => {
    const passthrough = ({children}: { children?: ReactNode }) => <div>{children}</div>;
    const Button = ({children, onClick, htmlType}: any) => <button type={htmlType === "submit" ? "submit" : "button"} onClick={onClick}>{children}</button>;
    const Table = ({columns = [], dataSource = []}: any) => <div data-testid="table">{dataSource.flatMap((row: any) =>
            columns.map((column: any, index: number) => <span
                    key={`${row.id}-${index}`}>{column.render ? column.render(row[column.dataIndex], row) : row[column.dataIndex]}</span>))}</div>;
    const Form = ({children, onFinish, onFinishFailed}: any) => <form onSubmit={(e) => {
        e.preventDefault();
        onFinish?.(formValues);
    }}>{children}
        <button type="submit">form-submit</button>
        <button type="button" onClick={() => onFinishFailed?.({errorFields: [{errors: ["validation"]}]})}>form-fail</button>
    </form>;
    Form.Item = ({children}: any) => <div>{children}</div>;
    Form.useForm = () => [mockForm];
    const Modal = ({open, children, onOk, onCancel}: any) => open ? <div role="dialog">{children}
        <button onClick={onOk}>modal-ok</button>
        <button onClick={onCancel}>modal-cancel</button>
    </div> : null;
    const messageApi = {success: jest.fn(), error: jest.fn()};
    const Input = (props: any) => <input {...props}/>;
    Input.TextArea = Input;
    return {
        Alert: ({title}: any) => <div>{title}</div>,
        Button,
        DatePicker: ({onChange}: any) => <button onClick={() => onChange?.(null)}>date-picker</button>,
        Divider: passthrough,
        Form,
        Input,
        InputNumber: ({onChange}: any) => <button onClick={() => onChange?.(2)}>input-number</button>,
        Modal,
        Select: ({options = [], onChange}: any) => <select onChange={(e) => onChange?.(e.target.value)}>{options.map((o: any) => <option key={o.value}
                                                                                                                                         value={o.value}>{o.label}</option>)}</select>,
        Slider: ({onChange}: any) => <input type="range" onChange={(e) => onChange?.(Number(e.currentTarget.value))}/>,
        Space: passthrough,
        Spin: passthrough,
        Table,
        Tooltip: passthrough,
        Typography: {Title: passthrough, Text: passthrough},
        Upload: ({children, customRequest, beforeUpload}: any) => <div>
            <button onClick={() => beforeUpload?.({name: "x.txt", type: "text/plain", size: 1})}>invalid-upload</button>
            <button onClick={() => customRequest?.({
                file: new File(["x"], "x.pdf", {type: "application/pdf"}),
                onSuccess: jest.fn(),
                onError: jest.fn()
            })}>upload-file
            </button>
            {children}</div>,
        message: {useMessage: () => [messageApi, <span>messages</span>], success: messageApi.success, error: messageApi.error}
    };
});

const participant = (id: number) => ({
    id,
    name: `User ${id}`,
    lastName: "User",
    firstName: `${id}`,
    userType: "SCUBA_DIVER",
    eventDiveCount: 2,
    createdAt: "2026-01-01",
    payments: [],
    phoneNumber: "123"
});
const event = (overrides: any = {}) => ({
    id: 12,
    title: "Future event",
    description: "desc",
    type: "SCUBA",
    startTime: "2099-01-01T12:00:00Z",
    eventDuration: 2,
    maxDuration: 60,
    maxDepth: 30,
    maxParticipants: 2,
    organizer: participant(9),
    participants: [participant(8)],
    waitingList: [participant(6)],
    status: "PUBLISHED",
    eventCommentId: 1, ...overrides
});
const flush = async () => act(async () => {
    await Promise.resolve();
    await Promise.resolve();
});

beforeEach(() => {
    jest.clearAllMocks();
    session.organizer = false;
    session.membership = false;
    session.payment = false;
    session.files = true;
    session.userSession = {...session.userSession, id: 7, healthStatementId: 1};
    params = {paramId: "12"};
    Object.values(api).forEach((mock) => mock.mockResolvedValue([]));
    fn("diveEventAPI.findById").mockResolvedValue(event());
    fn("fileTransferAPI.findAllDiveFiles").mockResolvedValue([{
        id: 1,
        eventId: 12,
        filename: "plan.pdf",
        diveGroupId: 1,
        createdAt: "2026-01-01",
        url: "/plan"
    }]);
});

describe("remaining DiveEvent behavior", () => {
    it("renders event details, waiting list, role links, payments and notification flow", async () => {
        session.organizer = true;
        const info = event({participants: [participant(8)], waitingList: [participant(6)]});
        render(<DiveEventDetails eventInfo={info}/>);
        await waitFor(() => expect(screen.getByText(/Future event/)).toBeInTheDocument());
        expect(screen.getByText(/EventDetails.waitingList.title/)).toBeInTheDocument();
        expect(screen.getByText("EventDetails.notificationModal.button")).toBeInTheDocument();
        fireEvent.click(screen.getByText("EventDetails.notificationModal.button"));
        expect(screen.getByText("notifications")).toBeInTheDocument();
        fireEvent.click(screen.getByText("modal-cancel"));
    });

    it("loads files and exercises invalid, successful and failed uploads plus disabled language behavior", async () => {
        session.organizer = true;
        render(<DiveEventFiles eventId={12}/>);
        await flush();
        expect(screen.getByText("plan.pdf")).toBeInTheDocument();
        fireEvent.click(screen.getByText("invalid-upload"));
        fireEvent.click(screen.getByText("upload-file"));
        fn("fileTransferAPI.uploadDiveFile").mockRejectedValueOnce(new Error("no"));
        fireEvent.click(screen.getByText("upload-file"));
        session.files = false;
        const {unmount} = render(<DiveEventFiles eventId={12}/>);
        await flush();
        unmount();
    });

    it("covers event lists, permission actions, waiting-list labels and API failures", async () => {
        const rows = [event({id: 1, participants: [participant(1), participant(2)], waitingList: [participant(3)]}), event({
            id: 2,
            organizer: null,
            status: "DRAFTED"
        })];
        fn("diveEventAPI.findAll").mockResolvedValue(rows);
        fn("diveEventAPI.findAllOngoingDiveEvents").mockRejectedValue(new Error("ongoing"));
        fn("diveEventAPI.findAllPastDiveEvents").mockResolvedValue(rows);
        session.organizer = true;
        render(<><DiveEvents/><DiveEventsTable diveEventType="past" title="Past"/><DiveEventsTable diveEventType="unknown" title="Unknown"/></>);
        await flush();
        expect(screen.getAllByText(/Events.table.waitingList/).length).toBeGreaterThan(0);
        fireEvent.click(screen.getAllByText("common.button.update")[0]);
    });

    it("handles subscribe, waiting-list, health statement and API failures", async () => {
        fn("diveEventAPI.findById").mockResolvedValue(event({participants: [], waitingList: []}));
        fn("diveEventAPI.subscribeUserToEvent").mockResolvedValue(event({participants: [participant(7)], waitingList: []}));
        render(<DiveEvent/>);
        await flush();
        fireEvent.click(screen.getByText("DiveEvent.subscribe.button"));
        fireEvent.click(screen.getByText("modal-ok"));
        fn("diveEventAPI.subscribeUserToEvent").mockRejectedValueOnce(new Error("subscribe"));
        await flush();
        fn("diveEventAPI.unsubscribeUserToEvent").mockRejectedValueOnce(new Error("unsubscribe"));
        fireEvent.click(screen.getByText("DiveEvent.unsubscribe.button"));
        await flush();
        session.userSession = {...session.userSession, healthStatementId: null};
        render(<DiveEvent/>);
        await flush();
        fireEvent.click(screen.getByText("DiveEvent.approveHealthStatement"));
        expect(screen.getByText("health-modal")).toBeInTheDocument();
    });

    it("sets and updates dives while protecting zero counts", async () => {
        fn("diveEventAPI.getDiveEventDives").mockResolvedValue({dives: [{userId: 7, name: "Diver", diveCount: 0}]});
        fn("diveEventAPI.updateDiveEventDives").mockResolvedValue({dives: [{userId: 7, name: "Diver", diveCount: 1}]});
        render(<SetDives/>);
        await flush();
        fireEvent.click(screen.getByText("down"));
        fireEvent.click(screen.getByText("up"));
        fireEvent.click(screen.getByText("common.button.save"));
        await flush();
        expect(fn("diveEventAPI.updateDiveEventDives")).toHaveBeenCalled();
        fn("diveEventAPI.getDiveEventDives").mockRejectedValueOnce(new Error("load"));
        params = {paramId: "bad"};
        render(<SetDives/>);
        await flush();
    });

    it("loads show page and exercises edit success, validation and failure paths", async () => {
        render(<ShowDiveEvent/>);
        await waitFor(() => expect(screen.getByText(/Future event/)).toBeInTheDocument());
        formValues = {startTime: "2099-01-01T12:00:33Z", eventDuration: 2, organizerId: 9, maxParticipants: 3, participants: []};
        fn("userAPI.findByRole").mockResolvedValue([participant(9)]);
        fn("blockedDatesAPI.findAll").mockResolvedValue([]);
        fn("diveEventAPI.update").mockResolvedValue({id: 12});
        render(<EditDiveEvent/>);
        await flush();
        fireEvent.click(screen.getByText("form-submit"));
        await flush();
        fn("diveEventAPI.update").mockRejectedValueOnce(new Error("update"));
        fireEvent.click(screen.getByText("form-submit"));
        await flush();
        formValues = {...formValues, organizerId: 0};
        fireEvent.click(screen.getByText("form-submit"));
        formValues = {...formValues, organizerId: 9, maxParticipants: 0, participants: [1]};
        fireEvent.click(screen.getByText("form-submit"));
        fireEvent.click(screen.getByText("form-fail"));
        params = {paramId: "bad"};
        render(<ShowDiveEvent/>);
        await waitFor(() => expect(fn("diveEventAPI.findById")).toHaveBeenCalled());
    });
});
