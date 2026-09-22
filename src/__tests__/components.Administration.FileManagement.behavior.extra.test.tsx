import {type ReactNode} from "react";
import {act, fireEvent, render, screen, waitFor} from "@testing-library/react";
import dayjs from "dayjs";
import {
    AddMemberships,
    AdminMain,
    AdminMembership,
    AdminMemberships,
    AdminOrgUser,
    AdminOrgUsers,
    AdminTagGroups,
    AdminTags,
    AdminUploads,
    AuditEvents,
    AvatarFiles,
    BlockedDates,
    CertificateFiles,
    CommentModeration,
    commonFileColumns,
    createActionColumn,
    DiveFiles,
    DocumentFiles,
    DownloadData,
    PageFiles,
    PortalConfigurations,
    TimezoneSelector
} from "../components";

var api: Record<string, jest.Mock>;
let mockRolesAllowed = false;

function makeApi(name: string) {
    api ??= {};
    return api[name] ??= jest.fn().mockResolvedValue([]);
}

function service(name: string, methods: string[]) {
    return Object.fromEntries(methods.map((method) => [method, makeApi(name + "." + method)]));
}

/** Wraps rows in the page envelope the server-paged list endpoints return. */
function mockPage<T>(rows: T[]) {
    return {content: rows, page: 0, size: 10, total_elements: rows.length, total_pages: 1, first: true, last: true, empty: rows.length === 0};
}

const mockGetPortalConfigurationValue = (_group: string, key: string) => key.includes("supported") ? "true" : "YEAR";
const mockGetFrontendConfigurationValue = () => "en,fi";
const mockT = (key: string) => key;

jest.mock("react-i18next", () => ({useTranslation: () => ({t: mockT})}));
jest.mock("react-router-dom", () => ({
    Link: ({children, to}: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
    useParams: () => ({paramId: "1"})
}));
jest.mock("../services", () => ({
    getApiBaseUrl: () => "http://api",
    blockedDatesAPI: service("blockedDatesAPI", ["findAll", "create", "delete"]),
    commentAPI: service("commentAPI", ["getPendingReports"]),
    diveEventAPI: service("diveEventAPI", ["findAllPastDiveEvents"]),
    downloadAPI: service("downloadAPI", ["downloadCertificates", "downloadDives", "downloadPayments"]),
    userAPI: service("userAPI", ["findAll", "findByRole", "findAdminUserById", "adminUpdateUser", "resetTerms", "resetHealthStatement"]),
    membershipAPI: service("membershipAPI", ["findPaged", "findByMemberId", "create", "update"]),
    tagGroupAPI: service("tagGroupAPI", ["findAll", "create", "update", "delete"]),
    tagsAPI: service("tagsAPI", ["findAll", "create", "update", "delete"]),
    auditAPI: service("auditAPI", ["findPagedAudits"]),
    portalConfigurationAPI: service("portalConfigurationAPI", ["findAllPortalConfigurations", "updateConfigurationValue", "reloadPortalConfiguration"]),
    fileTransferAPI: service("fileTransferAPI", ["findAllAvatarFiles", "findAllCertificateFiles", "findAllDiveFiles", "findAllDocuments", "findAllPageFiles", "removeDocumentFile"]),
    adminUserAPI: service("adminUserAPI", ["findPaged"]),
    authAPI: service("authAPI", ["recoverLostPassword"])
}));
jest.mock("../session", () => ({
    useSession: () => ({
        userSession: {access_token: "token"},
        getPortalConfigurationValue: mockGetPortalConfigurationValue,
        getFrontendConfigurationValue: mockGetFrontendConfigurationValue
    })
}));
jest.mock("../tools", () => ({
    checkRoles: () => mockRolesAllowed,
    roleEnum2Tag: (role: string) => <span>{role}</span>,
    membershipStatusEnum2Tag: (value: string) => <span>{value}</span>,
    membershipTypeEnum2Tag: (value: string) => <span>{value}</span>,
    formatDateTimeWithMs: (value: string) => value,
    getDefaultMembershipDates: () => ({start_date: {format: () => "2026-01-01"}, end_date: {format: () => "2026-12-31"}}),
    getApiBaseUrl: () => "http://api"
}));
jest.mock("../components/Commenting", () => ({
    CommentCard: () => <span>comment</span>,
    CommentModerationActions: () => <span>actions</span>,
    ReportCard: () => <span>report</span>
}));
jest.mock("../components/User", () => ({
    UserFields: ({isOrganizer}: { isOrganizer?: boolean }) => <span>user-fields-{String(isOrganizer)}</span>
}));
jest.mock("../components/main", () => ({
    OxTableSearch: ({children, onSearch, onCaseSensitiveChange}: {
        children?: ReactNode;
        onSearch?: (value: string) => void;
        onCaseSensitiveChange?: (value: boolean) => void
    }) =>
        <div>{children}
            <button onClick={() => onSearch?.("x")}>table-search</button>
            <button onClick={() => onCaseSensitiveChange?.(true)}>table-case</button>
        </div>,
    usePagedTable: (fetcher: (request: unknown) => Promise<unknown>, options?: { enabled?: boolean; deps?: unknown[] }) => {
        const React = jest.requireActual("react");
        const [dataSource, setDataSource] = React.useState([]);
        const [reloadCounter, setReloadCounter] = React.useState(0);
        const fetcherRef = React.useRef(fetcher);
        const depsKey = JSON.stringify(options?.deps ?? []);
        const enabled = options?.enabled !== false;
        React.useEffect(() => {
            fetcherRef.current = fetcher;
        });
        React.useEffect(() => {
            if (!enabled) {
                return;
            }
            Promise.resolve(fetcherRef.current({page: 0, size: 10}))
                .then((response: unknown) => {
                    const rows = Array.isArray(response) ? response : (response as { content?: unknown[] } | undefined)?.content ?? [];
                    setDataSource(rows);
                })
                .catch(() => setDataSource([]));
        }, [enabled, depsKey, reloadCounter]);
        return {
            dataSource, loading: false, pagination: {current: 1, pageSize: 10, total: dataSource.length}, handleTableChange: jest.fn(),
            search: "", setSearch: jest.fn(), case_sensitive: false, setCaseSensitive: jest.fn(), reload: () => setReloadCounter((value: number) => value + 1),
            error: false, contextHolder: null
        };
    },
    // Forms are horizontal in jsdom, matching the real hook when no breakpoint matches
    useResponsiveFormLayout: (labelSpan: number, wrapperSpan: number) => ({layout: "horizontal", labelCol: {span: labelSpan}, wrapperCol: {span: wrapperSpan}}),
    // Server-mode tables get their data props from the `paged` state, like the real OxTable does
    OxTable: ({paged, dataMode, ...props}: Record<string, unknown> & { paged?: Record<string, unknown>; dataMode?: string }) => {
        const {Table} = jest.requireMock("antd");
        const pagedProps = dataMode === "server" && paged
            ? {dataSource: paged.dataSource, loading: paged.loading, pagination: paged.pagination, onChange: paged.handleTableChange}
            : {};
        return <Table {...pagedProps} {...props}/>;
    },
    ProtectedImage: ({alt}: { alt: string }) => <img alt={alt}/>,
    ShiftableRangePicker: ({onChange}: { onChange: (value: unknown) => void }) => <button onClick={() => onChange([])}>range</button>
}));

jest.mock("antd", () => {
    const formInstance = {
        resetFields: jest.fn(),
        setFieldsValue: jest.fn(),
        getFieldValue: jest.fn(() => ""),
        validateFields: jest.fn().mockResolvedValue({code: "x", names: [{value: "X"}], type: "USER"})
    };
    const Form = ({children, onFinish}: { children: ReactNode; onFinish?: (v: unknown) => void }) => (
            <form onSubmit={(event) => {
                event.preventDefault();
                onFinish?.({});
            }}>{children}</form>
    );
    Form.Item = ({children}: { children: ReactNode }) => <div>{children}</div>;
    Form.useForm = () => [formInstance];
    Form.useWatch = jest.fn(() => undefined);
    const Button = ({children, onClick, htmlType}: { children: ReactNode; onClick?: () => void; htmlType?: string }) =>
            <button type={htmlType === "submit" ? "submit" : "button"} onClick={onClick}>{children}</button>;
    const Input = ({value, onChange, placeholder}: { value?: string; onChange?: (event: { target: { value: string } }) => void; placeholder?: string }) =>
            <input value={value} placeholder={placeholder} onChange={onChange}/>;
    Input.TextArea = Input;
    const Select = ({options = [], onChange}: { options?: Array<{ label?: string; value?: string }>; onChange?: (v: string) => void }) =>
            <select onChange={(e) => onChange?.(e.target.value)}>{options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>;
    const Table = ({columns = [], dataSource = [], onChange}: {
        columns?: Array<{ render?: (v: unknown, r: unknown) => ReactNode }>;
        dataSource?: unknown[];
        onChange?: (...args: unknown[]) => void
    }) => (
            <div data-testid="table">{dataSource.map((record, index) => columns.map((column, columnIndex) =>
                    <span key={`${index}-${columnIndex}`}>{column.render ? column.render(undefined, record) : null}</span>))}
                <button onClick={() => onChange?.({current: 0}, {}, {field: undefined, order: undefined})}>table-change</button>
                <button onClick={() => onChange?.({current: 1}, {}, [{field: "user_name", order: "ascend"}])}>table-sort</button>
            </div>
    );
    const Modal = ({open, children, onOk, onCancel}: { open?: boolean; children: ReactNode; onOk?: () => void; onCancel?: () => void }) =>
            open ? <div role="dialog">{children}
                <button onClick={onOk}>modal-ok</button>
                <button onClick={onCancel}>modal-cancel</button>
            </div> : null;
    const messageApi = {success: jest.fn(), error: jest.fn()};
    const messageHolder = <span key="message">messages</span>;
    const message = {useMessage: () => [messageApi, messageHolder], success: jest.fn(), error: jest.fn()};
    const passthrough = ({children}: { children?: ReactNode }) => <div>{children}</div>;
    const Space = Object.assign(passthrough, {Compact: passthrough});
    return {
        Form,
        Button,
        Input,
        Select,
        Table,
        Modal,
        message,
        Spin: passthrough,
        Space,
        Divider: passthrough,
        Row: passthrough,
        Col: passthrough,
        Tag: passthrough,
        Typography: {Text: passthrough, Title: passthrough, Paragraph: passthrough},
        Checkbox: Object.assign(passthrough, {Group: passthrough}),
        DatePicker: ({onChange}: { onChange?: (v: unknown) => void }) => <button onClick={() => onChange?.(null)}>date</button>,
        InputNumber: ({onChange}: { onChange?: (v: number) => void }) => <button onClick={() => onChange?.(2)}>number</button>,
        Radio: {
            Group: ({options = [], onChange}: { options?: Array<{ value: string }>; onChange?: (e: unknown) => void }) => <button
                    onClick={() => onChange?.({target: {value: options[0]?.value}})}>radio</button>
        },
        Switch: ({onChange}: { onChange?: (v: boolean) => void }) => <button onClick={() => onChange?.(true)}>switch</button>,
        Tooltip: passthrough,
        Popconfirm: ({children, onConfirm}: { children: ReactNode; onConfirm?: () => void }) => <span onClick={onConfirm}>{children}</span>,
        Upload: ({children, onChange}: { children: ReactNode; onChange?: (info: unknown) => void }) => <span
                onClick={() => onChange?.({file: {status: "done", name: "x"}})}>{children}</span>,
        Tabs: ({items = []}: { items?: Array<{ label: ReactNode; children: ReactNode }> }) => <div>{items.map((item, i) => <section
                key={i}>{item.label}{item.children}</section>)}</div>
    };
});

const flush = async () => act(async () => {
    await Promise.resolve();
});

describe("Administration pages", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockRolesAllowed = false;
        Object.values(api).forEach((mock) => mock.mockResolvedValue([]));
        api["portalConfigurationAPI.findAllPortalConfigurations"].mockResolvedValue([
            {id: 1, group_key: "FILES", setting_key: "enabled", value_type: "boolean", runtime_value: "false", default_value: "false", required_runtime: false},
            {id: 2, group_key: "MAIL", setting_key: "address", value_type: "email", runtime_value: "", default_value: "", required_runtime: true},
            {id: 3, group_key: "FILES", setting_key: "count", value_type: "number", runtime_value: "2", default_value: "0", required_runtime: false},
            {id: 4, group_key: "FILES", setting_key: "day", value_type: "date", runtime_value: "2026-01-01", default_value: "", required_runtime: false},
            {id: 5, group_key: "FILES", setting_key: "langs", value_type: "array", runtime_value: "a", default_value: "a,b", required_runtime: false},
            {
                id: 6,
                group_key: "FILES",
                setting_key: "membership-type",
                value_type: "enum",
                runtime_value: "USER",
                default_value: "DISABLED",
                required_runtime: false
            }
        ]);
    });

    it("renders static, download, timezone and moderation states", async () => {
        global.fetch = jest.fn().mockResolvedValue({json: () => Promise.resolve({Europe: [{value: "Europe/Helsinki", label: "Helsinki"}]})}) as jest.Mock;
        render(<><AdminMain/><DownloadData/><TimezoneSelector selectedValue="" onChange={jest.fn()}/><CommentModeration/></>);
        await flush();
        expect(screen.getByText("AdminMain.header")).toBeInTheDocument();
        fireEvent.change(screen.getAllByRole("combobox")[0], {target: {value: "CERTIFICATE"}});
    });

    it("renders date administration and exercises API success/error callbacks", async () => {
        api["blockedDatesAPI.findAll"].mockResolvedValue([{id: 1, blocked_date: "2099-01-01", creator_name: "a", reason: "r"}]);
        render(<BlockedDates/>);
        await flush();
        expect(screen.getByTestId("table")).toBeInTheDocument();
        expect(screen.getByText("common.button.delete")).toBeInTheDocument();
    });

    it("renders configuration editors and file management tabs", async () => {
        render(<><PortalConfigurations/><AdminUploads/><AvatarFiles/><CertificateFiles/><DiveFiles/><DocumentFiles/><PageFiles/></>);
        await flush();
        expect(screen.getByText("PortalConfigurations.title")).toBeInTheDocument();
        fireEvent.click(screen.getByText("AdminUploads.overview.tab-title"));
        expect(screen.getAllByTestId("table").length).toBeGreaterThan(0);
    });

    it("renders membership and organization administration views", async () => {
        api["membershipAPI.findByMemberId"].mockResolvedValue({
            id: 1, user_id: 2, username: "member", status: "ACTIVE", type: "YEAR",
            start_date: dayjs("2026-01-01"), end_date: dayjs("2026-12-31")
        });
        api["membershipAPI.findPaged"].mockResolvedValue(mockPage([]));
        api["userAPI.findAdminUserById"].mockResolvedValue({
            id: 2, username: "member", first_name: "A", last_name: "User", status: "ACTIVE",
            roles: [], privacy: false, payments: [], approved_terms: false, health_statement_id: null
        });
        api["adminUserAPI.findPaged"].mockResolvedValue(mockPage([]));
        render(<><AdminMemberships/><AdminOrgUsers/></>);
        await flush();
        expect(screen.getByText("AdminMembers.title")).toBeInTheDocument();
    });

    it("covers membership editing, adding, user actions, and file column branches", async () => {
        const member = {
            id: 1, user_id: 2, username: "member", status: "ACTIVE", type: "YEAR",
            start_date: dayjs("2026-01-01"), end_date: dayjs("2026-12-31")
        };
        api["membershipAPI.findByMemberId"].mockResolvedValue(member);
        api["membershipAPI.create"].mockResolvedValue(member);
        api["membershipAPI.update"].mockResolvedValue(member);
        api["userAPI.findByRole"].mockResolvedValue([{id: 2, name: "Member"}]);
        api["userAPI.findAdminUserById"].mockResolvedValue({
            id: 2, username: "member", first_name: "A", last_name: "User", status: "ACTIVE",
            roles: [], privacy: false, payments: [], approved_terms: false, health_statement_id: null
        });
        api["authAPI.recoverLostPassword"].mockResolvedValue({status: "OK"});
        api["userAPI.adminUpdateUser"].mockResolvedValue({
            id: 2, username: "member", first_name: "A", last_name: "User", status: "ACTIVE",
            roles: [], privacy: false, payments: [], approved_terms: false, health_statement_id: null
        });
        render(<AdminMembership/>);
        await flush();
        expect(screen.getByText("member 2026-01-01 - 2026-12-31")).toBeInTheDocument();
        fireEvent.click(screen.getByText("common.button.update"));
        render(<AdminOrgUser/>);
        await flush();
        fireEvent.click(screen.getByText("AdminOrgUser.form.button.sendPasswordEmail"));
        await flush();
        expect(api["authAPI.recoverLostPassword"]).toHaveBeenCalled();
        mockRolesAllowed = true;
        render(<AdminOrgUser/>);
        await flush();
        expect(screen.getByText("user-fields-true")).toBeInTheDocument();
    });

    it("covers organization reset outcomes and file API error branches", async () => {
        api["adminUserAPI.findPaged"].mockResolvedValue(mockPage([{
            id: 3, username: "anon", first_name: "A", last_name: "N", status: "ANONYMIZED",
            roles: ["ROLE_ADMIN"], privacy: false, payments: [], approved_terms: true, health_statement_id: 0
        }]));
        api["userAPI.resetTerms"].mockResolvedValue(false);
        api["userAPI.resetHealthStatement"].mockResolvedValue(false);
        api["fileTransferAPI.findAllDiveFiles"].mockRejectedValue(new Error("dive"));
        api["fileTransferAPI.findAllDocuments"].mockRejectedValue(new Error("documents"));
        api["fileTransferAPI.findAllPageFiles"].mockRejectedValue(new Error("pages"));
        render(<><AddMemberships onMembershipAdded={jest.fn()}/><AdminOrgUsers/><DiveFiles/><DocumentFiles/><PageFiles/></>);
        await flush();
        window.confirm = jest.fn().mockReturnValue(true);
        fireEvent.click(screen.getByText("AdminOrgUsers.terms.resetButton"));
        fireEvent.click(screen.getByText("AdminOrgUsers.healthStatement.resetButton"));
        await flush();
        expect(api["userAPI.resetTerms"]).toHaveBeenCalled();
        expect(api["userAPI.resetHealthStatement"]).toHaveBeenCalled();
    });

    it("renders tag pages, table filters, actions, and audit refresh", async () => {
        api["tagGroupAPI.findAll"].mockResolvedValue([{id: 1, code: "g", names: {en: "Group"}, type: "USER"}]);
        api["tagsAPI.findAll"].mockResolvedValue([{id: 2, code: "t", names: {en: "Tag"}, tag_group_id: 1}]);
        api["auditAPI.findPagedAudits"].mockResolvedValue({content: [], number: 0, size: 10, totalElements: 0});
        render(<><AdminTagGroups/><AdminTags/><AuditEvents/></>);
        await flush();
        fireEvent.click(screen.getByText("AdminTagGroups.button.add-group"));
        fireEvent.click(screen.getAllByText("modal-ok")[0]);
        fireEvent.click(screen.getByText("AdminTags.button.add-tag"));
        fireEvent.click(screen.getAllByText("modal-ok")[0]);
        fireEvent.click(screen.getAllByText("table-change").at(-1)!);
        await waitFor(() => expect(api["auditAPI.findPagedAudits"]).toHaveBeenCalled());
    });

    it("covers file column renderers, upload callbacks, deletion and status colours", async () => {
        api["fileTransferAPI.findAllDiveFiles"].mockResolvedValue(mockPage([
            {
                id: 1,
                event_id: 10,
                dive_group_id: 20,
                status: "UPLOADED",
                filename: "dive.pdf",
                filesize: 2048,
                creator: "a",
                created_at: "2026-01-01",
                url: "/dive"
            }
        ]));
        api["fileTransferAPI.findAllDocuments"].mockResolvedValue(mockPage([
            {id: 2, status: "PUBLISHED", filename: "doc.pdf", filesize: 1024, creator: "b", created_at: "2026-01-02", url: "/doc"}
        ]));
        api["fileTransferAPI.findAllPageFiles"].mockResolvedValue(mockPage([
            {id: 3, page_id: 30, language: "en", status: "UPLOADED", filename: "one", filesize: 1024, creator: "c", created_at: "2026-01-03", url: "/one"},
            {id: 4, page_id: 31, language: "fi", status: "PUBLISHED", filename: "two", filesize: 2048, creator: "d", created_at: "2026-01-04", url: "/two"},
            {id: 5, page_id: 32, language: "sv", status: "DELETED", filename: "three", filesize: 3072, creator: "e", created_at: "2026-01-05", url: "/three"}
        ]));
        api["fileTransferAPI.removeDocumentFile"].mockResolvedValue({});
        render(<><DiveFiles/><DocumentFiles/><PageFiles/></>);
        await waitFor(() => expect(api["fileTransferAPI.findAllPageFiles"]).toHaveBeenCalled());
        expect(screen.getAllByTestId("table")).toHaveLength(3);
        fireEvent.click(screen.getByText("AdminUploads.document.upload.button"));
        fireEvent.click(screen.getByText("common.button.delete"));
        await flush();
        expect(api["fileTransferAPI.removeDocumentFile"]).toHaveBeenCalledWith(2);

        const columns = commonFileColumns(mockT as never);
        expect(columns).toHaveLength(6);
        expect(columns[1].render?.(2048, {} as never, 0)).toBeTruthy();
        expect(columns[5].render?.("/preview", {} as never, 0)).toBeTruthy();
        const actions = createActionColumn(mockT as never, {
            onEdit: jest.fn(),
            onDelete: jest.fn()
        });
        const action = actions[0].render?.(undefined, {id: 9} as never, 0);
        expect(action).toBeTruthy();
    });
});
