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
    DiveFiles,
    DocumentFiles,
    DownloadData,
    PageFiles,
    PortalConfigurations,
    TimezoneSelector
} from "../components";

var api: Record<string, jest.Mock>;
let configMode = "enabled";
let routeParam = "1";

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

const mockGetPortalConfigurationValue = (_group: string, key: string) =>
        configMode === "disabled" && (key === "membership-type" || key === "documents-supported" || key === "dive-files-supported")
                ? key === "membership-type" ? "DISABLED" : "false" : key.includes("supported") ? "true" : "YEAR";
const mockGetFrontendConfigurationValue = () => "en,fi";
const mockT = (key: string) => key;

jest.mock("react-i18next", () => ({useTranslation: () => ({t: mockT})}));
jest.mock("react-router-dom", () => ({
    Link: ({children, to}: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
    useParams: () => ({paramId: routeParam})
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
    checkRoles: () => false,
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
jest.mock("../components/User", () => ({UserFields: () => <span>user-fields</span>}));
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
                onFinish?.({
                    id: 7, user_id: 7, username: "user@example.com", first_name: "First", last_name: "Last",
                    status: "ACTIVE", type: "YEAR", roles: ["ROLE_USER"], privacy: false, approved_terms: true,
                    health_statement_id: null, userIdList: [7], dateRange: []
                });
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
        columns?: Array<{
            render?: (v: unknown, r: Record<string, unknown>) => ReactNode;
            filterDropdown?: (p: Record<string, unknown>) => ReactNode;
            filterIcon?: (v: boolean) => ReactNode;
            onFilter?: (v: string, r: Record<string, unknown>) => boolean;
            sorter?: (a: Record<string, unknown>, b: Record<string, unknown>) => number
        }>;
        dataSource?: Record<string, unknown>[];
        onChange?: (...args: unknown[]) => void
    }) => {
        const record = dataSource[0];
        if (record) {
            columns.forEach((column) => {
                column.render?.(undefined, record);
                column.filterDropdown?.({setSelectedKeys: jest.fn(), selectedKeys: ["x"], confirm: jest.fn(), clearFilters: jest.fn(), close: jest.fn()});
                column.filterIcon?.(true);
                column.onFilter?.("x", record);
                if (typeof column.sorter === "function") column.sorter(record, record);
            });
        }
        return <div data-testid="table">{dataSource.map((item, index) => columns.map((column, columnIndex) =>
                <span key={`${index}-${columnIndex}`}>{column.render ? column.render(undefined, item) : null}</span>))}
            <button onClick={() => onChange?.({current: 0}, {}, {field: undefined, order: undefined})}>table-change</button>
            <button onClick={() => onChange?.({current: 1}, {}, [{field: "user_name", order: "ascend"}])}>table-sort</button>
        </div>;
    };
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
        Upload: ({children, onChange}: { children: ReactNode; onChange?: (info: unknown) => void }) =>
                <span onClick={() => {
                    onChange?.({file: {status: "done", name: "x"}});
                    onChange?.({file: {status: "error", name: "x"}});
                }}>{children}</span>,
        Tabs: ({items = []}: { items?: Array<{ label: ReactNode; children: ReactNode }> }) => <div>{items.map((item, i) => <section
                key={i}>{item.label}{item.children}</section>)}</div>,
        Collapse: ({items = []}: { items?: Array<{ label: ReactNode; children: ReactNode }> }) => <div>{items.map((item, i) => <section
                key={i}>{item.label}{item.children}</section>)}</div>
    };
});

const flush = async () => act(async () => {
    await Promise.resolve();
});

describe("Administration pages", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        configMode = "enabled";
        routeParam = "1";
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

    it("renders certificate classification in the organization user list", async () => {
        api["adminUserAPI.findPaged"].mockResolvedValue(mockPage([{
            id: 2, username: "member", first_name: "A", last_name: "User", status: "ACTIVE",
            roles: [], privacy: false, payments: [], approved_terms: false, health_statement_id: null,
            certificate_classification_title: "Open water"
        }]));

        render(<AdminOrgUsers/>);
        await flush();

        expect(screen.getByText("Open water")).toBeInTheDocument();
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

    it("drives successful administration workflows and all populated table renderers", async () => {
        const now = dayjs();
        const user = {
            id: 7, username: "user@example.com", first_name: "First", last_name: "Last",
            status: "ACTIVE", roles: ["ROLE_USER", "ROLE_ORGANIZER", "ROLE_ADMIN"],
            privacy: true, payments: [
                {id: 1, payment_type: "PERIODICAL", start_date: now.subtract(1, "day"), end_date: now.add(1, "day")},
                {id: 2, payment_type: "ONE_TIME", start_date: now.subtract(1, "day"), end_date: now.add(1, "day")},
                {id: 3, payment_type: "ONE_TIME", start_date: now.add(2, "day"), end_date: now.add(3, "day")}
            ], approved_terms: true, health_statement_id: 4
        };
        api["adminUserAPI.findPaged"].mockResolvedValue(mockPage([user, {
            ...user,
            id: 8,
            username: "anon",
            status: "ANONYMIZED",
            approved_terms: false,
            health_statement_id: null,
            payments: []
        }]));
        api["membershipAPI.findPaged"].mockResolvedValue(mockPage([{
            id: 4, user_id: 7, username: "user@example.com", status: "ACTIVE", type: "YEAR",
            start_date: now.subtract(1, "day"), end_date: now.add(1, "day"), created: now
        }]));
        api["userAPI.findByRole"].mockResolvedValue([{id: 7, name: "First Last"}]);
        api["fileTransferAPI.findAllAvatarFiles"].mockResolvedValue(mockPage([{
            id: 1,
            filename: "avatar",
            filesize: 1024,
            creator: "u",
            created_at: now,
            url: "/a"
        }]));
        api["fileTransferAPI.findAllCertificateFiles"].mockResolvedValue(mockPage([{
            id: 2,
            filename: "cert",
            filesize: 2048,
            creator: "u",
            created_at: now,
            url: "/c"
        }]));
        api["fileTransferAPI.findAllDiveFiles"].mockResolvedValue(mockPage([{
            id: 3,
            event_id: 1,
            dive_group_id: 2,
            status: "UPLOADED",
            filename: "dive",
            filesize: 2048,
            creator: "u",
            created_at: now,
            url: "/d"
        }]));
        api["fileTransferAPI.findAllDocuments"].mockResolvedValue(mockPage([{
            id: 4,
            status: "PUBLISHED",
            filename: "doc",
            filesize: 2048,
            creator: "u",
            created_at: now,
            url: "/doc"
        }]));
        api["fileTransferAPI.findAllPageFiles"].mockResolvedValue(mockPage([
            {id: 5, page_id: 1, language: "en", status: "UPLOADED", filename: "one", filesize: 1024, creator: "u", created_at: now, url: "/one"},
            {id: 6, page_id: 2, language: "fi", status: "PUBLISHED", filename: "two", filesize: 1024, creator: "u", created_at: now, url: "/two"},
            {id: 7, page_id: 3, language: "sv", status: "DELETED", filename: "three", filesize: 1024, creator: "u", created_at: now, url: "/three"}
        ]));
        api["auditAPI.findPagedAudits"].mockResolvedValue({
            content: [{id: 1, created_at: "2026-01-01", user_name: "u", trace_id: "trace", source: "web", level: "ERROR", address: "local", message: "failed"}],
            pageable: {pageNumber: 0, pageSize: 10}, totalElements: 1
        });
        api["portalConfigurationAPI.findAllPortalConfigurations"].mockResolvedValue([
            {id: 10, group_key: "G", setting_key: "array", value_type: "array", runtime_value: "a", default_value: "a,b", required_runtime: false},
            {id: 11, group_key: "G", setting_key: "bool", value_type: "boolean", runtime_value: "false", default_value: "false", required_runtime: false},
            {id: 12, group_key: "G", setting_key: "date", value_type: "date", runtime_value: "2026-01-01", default_value: "", required_runtime: false},
            {id: 13, group_key: "G", setting_key: "email", value_type: "email", runtime_value: "ok@example.com", default_value: "", required_runtime: true},
            {id: 14, group_key: "G", setting_key: "number", value_type: "number", runtime_value: "2", default_value: "0", required_runtime: false},
            {id: 15, group_key: "G", setting_key: "string", value_type: "string", runtime_value: "x", default_value: "", required_runtime: false},
            {id: 16, group_key: "G", setting_key: "timezone", value_type: "timezone", runtime_value: "UTC", default_value: "", required_runtime: false},
            {
                id: 17,
                group_key: "G",
                setting_key: "membership-type",
                value_type: "enum",
                runtime_value: "USER",
                default_value: "DISABLED",
                required_runtime: false
            },
            {
                id: 18,
                group_key: "G",
                setting_key: "membership-period-unit",
                value_type: "enum",
                runtime_value: "YEAR",
                default_value: "YEAR",
                required_runtime: false
            },
            {
                id: 19,
                group_key: "G",
                setting_key: "periodical-payment-method-type",
                value_type: "enum",
                runtime_value: "PERIODICAL",
                default_value: "PERIODICAL",
                required_runtime: false
            },
            {
                id: 20,
                group_key: "G",
                setting_key: "periodical-payment-method-unit",
                value_type: "enum",
                runtime_value: "YEAR",
                default_value: "YEAR",
                required_runtime: false
            },
            {id: 21, group_key: "G", setting_key: "unknown", value_type: "enum", runtime_value: "x", default_value: "x", required_runtime: false}
        ]);
        api["portalConfigurationAPI.reloadPortalConfiguration"].mockResolvedValue([{
            id: 10,
            group_key: "G",
            setting_key: "x",
            value_type: "string",
            runtime_value: "x",
            default_value: "x",
            required_runtime: false
        }]);
        api["commentAPI.getPendingReports"].mockResolvedValue([{id: 1, title: "", body: "A comment body", child_count: 1, reports: [{id: 2}]}]);
        api["tagGroupAPI.findAll"].mockResolvedValue([{id: 1, code: "g", names: {en: "Group"}, type: "USER"}]);
        api["tagsAPI.findAll"].mockResolvedValue([{id: 2, code: "t", names: {en: "Tag"}, tag_group_id: 1}]);
        global.fetch = jest.fn().mockResolvedValue({json: () => Promise.resolve({UTC: [{value: "UTC", label: "UTC"}]})}) as jest.Mock;

        render(<>
            <AdminOrgUsers/><AdminMemberships/><AddMemberships onMembershipAdded={jest.fn()}/>
            <AvatarFiles/><CertificateFiles/><DiveFiles/><DocumentFiles/><PageFiles/>
            <AuditEvents/><PortalConfigurations/><CommentModeration/>
        </>);
        await waitFor(() => expect(api["adminUserAPI.findPaged"]).toHaveBeenCalled());
        await flush();
        api["portalConfigurationAPI.updateConfigurationValue"].mockRejectedValue(new Error("update failed"));
        fireEvent.click(screen.getAllByText("switch")[0]);
        fireEvent.click(screen.getAllByText("date")[0]);
        fireEvent.click(screen.getAllByText("number")[0]);
        fireEvent.click(screen.getAllByText("radio")[0]);
        screen.getAllByText("common.button.update").forEach(button => fireEvent.click(button));
        fireEvent.click(screen.getByText("AdminUploads.document.upload.button"));
        fireEvent.click(screen.getByText("common.button.delete"));
        fireEvent.click(screen.getByText("AdminOrgUsers.terms.resetButton"));
        fireEvent.click(screen.getByText("AdminOrgUsers.healthStatement.resetButton"));
        fireEvent.click(screen.getByText("PortalConfigurations.button.reload"));
        api["portalConfigurationAPI.reloadPortalConfiguration"].mockRejectedValue(new Error("reload failed"));
        fireEvent.click(screen.getByText("PortalConfigurations.button.reload"));
        fireEvent.click(screen.getAllByText("table-sort")[0]);
        await flush();
        expect(api["fileTransferAPI.removeDocumentFile"]).toHaveBeenCalled();
        expect(api["portalConfigurationAPI.reloadPortalConfiguration"]).toHaveBeenCalled();
    });

    it("covers disabled, invalid, rejected, and alternate download paths", async () => {
        configMode = "disabled";
        const added = jest.fn();
        render(<AddMemberships onMembershipAdded={added}/>);
        expect(screen.getByText("AddMemberships.disabled")).toBeInTheDocument();
        configMode = "enabled";
        api["userAPI.findByRole"].mockRejectedValue(new Error("users"));
        render(<AddMemberships onMembershipAdded={added}/>);
        await flush();
        expect(api["userAPI.findByRole"]).toHaveBeenCalled();
        configMode = "enabled";
        api["userAPI.findByRole"].mockResolvedValue([{id: 7, name: "User"}]);
        render(<AddMemberships onMembershipAdded={added}/>);
        fireEvent.click(screen.getAllByText("AddMemberships.form.button").at(-1)!);
        await flush();
        expect(api["membershipAPI.create"]).toHaveBeenCalled();

        api["downloadAPI.downloadCertificates"].mockResolvedValue([{id: 1}]);
        api["downloadAPI.downloadDives"].mockResolvedValue([{id: 2}]);
        api["diveEventAPI.findAllPastDiveEvents"].mockResolvedValue([{id: 3}]);
        api["userAPI.findAll"].mockResolvedValue([{id: 4}]);
        api["downloadAPI.downloadPayments"].mockResolvedValue([{id: 5}]);
        render(<DownloadData/>);
        const select = screen.getAllByRole("combobox").at(-1)!;
        for (const value of ["CERTIFICATE", "DIVE", "DIVE_EVENT", "MEMBER", "PAYMENT"]) {
            fireEvent.change(select, {target: {value}});
            await flush();
        }
        expect(api["downloadAPI.downloadPayments"]).toHaveBeenCalled();

        global.fetch = jest.fn().mockRejectedValue(new Error("timezones")) as jest.Mock;
        window.confirm = jest.fn();
        render(<TimezoneSelector selectedValue="" onChange={jest.fn()}/>);
        await flush();
        expect(window.confirm).toHaveBeenCalled();

        api["commentAPI.getPendingReports"].mockRejectedValue(new Error("reports"));
        render(<CommentModeration/>);
        await flush();
        expect(api["commentAPI.getPendingReports"]).toHaveBeenCalled();

        routeParam = "invalid";
        render(<AdminMembership/>);
        routeParam = "1";
        api["membershipAPI.findByMemberId"].mockRejectedValue(new Error("membership"));
        render(<AdminMembership/>);
        await flush();
        expect(api["membershipAPI.findByMemberId"]).toHaveBeenCalled();

        api["userAPI.findAdminUserById"].mockRejectedValue(new Error("user"));
        render(<AdminOrgUser/>);
        await flush();
        expect(api["userAPI.findAdminUserById"]).toHaveBeenCalled();

        api["userAPI.findAdminUserById"].mockResolvedValue({
            id: 7, username: "user@example.com", first_name: "First", last_name: "Last",
            status: "ACTIVE", roles: ["ROLE_USER"], privacy: true, payments: [],
            approved_terms: true, health_statement_id: null
        });
        api["authAPI.recoverLostPassword"].mockResolvedValue({status: "OK"});
        api["userAPI.adminUpdateUser"].mockResolvedValue({
            id: 7, username: "user@example.com", first_name: "First", last_name: "Last",
            status: "ACTIVE", roles: ["ROLE_USER"], privacy: false, payments: [],
            approved_terms: true, health_statement_id: null
        });
        render(<AdminOrgUser/>);
        await flush();
        fireEvent.click(screen.getAllByText("AdminOrgUser.form.button.sendPasswordEmail").at(-1)!);
        fireEvent.submit(screen.getAllByRole("button", {name: "AdminOrgUser.form.button.update"}).at(-1)!.closest("form")!);
        await flush();
        expect(api["userAPI.adminUpdateUser"]).toHaveBeenCalled();

        api["blockedDatesAPI.findAll"].mockRejectedValue(new Error("blocked"));
        render(<BlockedDates/>);
        await flush();
        expect(api["blockedDatesAPI.findAll"]).toHaveBeenCalled();

        configMode = "disabled";
        render(<><DiveFiles/><DocumentFiles/></>);
        configMode = "enabled";
        api["fileTransferAPI.findAllDocuments"].mockResolvedValue(mockPage([{
            id: 99,
            status: "PUBLISHED",
            filename: "doc",
            filesize: 1,
            creator: "u",
            created_at: dayjs(),
            url: "/doc"
        }]));
        api["fileTransferAPI.removeDocumentFile"].mockRejectedValue(new Error("remove"));
        render(<DocumentFiles/>);
        await flush();
        fireEvent.click(screen.getAllByText("AdminUploads.document.upload.button").at(-1)!);
        fireEvent.click(screen.getAllByText("common.button.delete").at(-1)!);
    });
});
