import {type ReactNode} from "react";
import {act, fireEvent, render, screen, waitFor} from "@testing-library/react";
import {
    AdminCertificateClassifications,
    AdminMain,
    AdminMemberships,
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
    certificateAPI: service("certificateAPI", ["findCertificateNames", "findOrganizations", "updateClassification", "replaceOrganizations", "replaceCertificateNames"]),
    certificateClassificationAPI: service("certificateClassificationAPI", ["findAll", "create", "update", "delete", "reorder"]),
    blockedDatesAPI: service("blockedDatesAPI", ["findAll", "create", "delete"]),
    commentAPI: service("commentAPI", ["getPendingReports"]),
    diveEventAPI: service("diveEventAPI", ["findAllPastDiveEvents"]),
    downloadAPI: service("downloadAPI", ["downloadCertificates", "downloadDives", "downloadPayments"]),
    userAPI: service("userAPI", ["findAll", "findByRole", "findAdminUserById", "resetTerms", "resetHealthStatement"]),
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
    OxTable: (props: Record<string, unknown>) => {
        const {Table} = jest.requireMock("antd");
        return <Table {...props}/>;
    },
    ProtectedImage: ({alt}: { alt: string }) => <img alt={alt}/>,
    ShiftableRangePicker: ({onChange}: { onChange: (value: unknown) => void }) => <button onClick={() => onChange([])}>range</button>
}));

jest.mock("antd", () => {
    const Form = ({children, onFinish}: { children: ReactNode; onFinish?: (v: unknown) => void }) => (
            <form onSubmit={(event) => {
                event.preventDefault();
                onFinish?.({
                    certificateId: 7, certificateNames: ["Open Water"], classificationId: 2,
                    existingValues: ["old"], newValue: " new "
                });
            }}>{children}</form>
    );
    Form.Item = ({children}: { children: ReactNode }) => <div>{children}</div>;
    Form.useForm = () => [{
        resetFields: jest.fn(),
        setFieldsValue: jest.fn(),
        getFieldValue: jest.fn(() => ""),
        validateFields: jest.fn().mockResolvedValue({
            code: "x", names: [{value: "X"}], type: "USER",
            titles: [{value: "Title"}], description: "Description",
            existingValues: ["old"], newValue: " new "
        })
    }];
    Form.useWatch = jest.fn(() => undefined);
    const Button = ({children, onClick, htmlType}: { children: ReactNode; onClick?: () => void; htmlType?: string }) =>
            <button type={htmlType === "submit" ? "submit" : "button"} onClick={onClick}>{children}</button>;
    const Input = ({value, onChange, placeholder}: { value?: string; onChange?: (event: { target: { value: string } }) => void; placeholder?: string }) =>
            <input value={value} placeholder={placeholder} onChange={onChange}/>;
    Input.TextArea = Input;
    const AutoComplete = ({options = [], showSearch, placeholder}: {
        options?: Array<{ value: string }>;
        showSearch?: { onSearch?: (value: string) => void };
        placeholder?: string;
    }) => <div>
        <input placeholder={placeholder} onChange={event => showSearch?.onSearch?.(event.target.value)}/>
        {options.map(option => <span key={option.value}>{option.value}</span>)}
    </div>;
    const Select = ({options = [], onChange, mode, showSearch}: {
        options?: Array<{ label?: string; value?: string }>;
        onChange?: (v: string) => void;
        mode?: string;
        showSearch?: { onSearch?: (value: string) => void };
    }) => <div>
        {mode === "multiple" && showSearch && <input onChange={event => showSearch.onSearch?.(event.target.value)}/>}
        <select onChange={(e) => onChange?.(e.target.value)}>{options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
    </div>;
    const Table = ({columns = [], dataSource = [], onChange, onRow}: {
        columns?: Array<{ render?: (v: unknown, r: unknown) => ReactNode }>;
        dataSource?: unknown[];
        onChange?: (...args: unknown[]) => void
        onRow?: (record: unknown) => { onDragStart?: () => void; onDragEnd?: () => void; onDragOver?: (event: unknown) => void; onDrop?: () => void }
    }) => (
            <div data-testid="table">{dataSource.map((record) => columns.map((column, columnIndex) =>
                    <span key={columnIndex}>{column.render ? column.render((record as { names?: unknown }).names, record) : null}</span>).concat([
                <button key="drag-start" onClick={() => onRow?.(record)?.onDragStart?.()}>row-drag-start</button>,
                <button key="drag-end" onClick={() => onRow?.(record)?.onDragEnd?.()}>row-drag-end</button>,
                <button key="drag-over" onClick={() => onRow?.(record)?.onDragOver?.({preventDefault: jest.fn()})}>row-drag-over</button>,
                <button key="drop" onClick={() => onRow?.(record)?.onDrop?.()}>row-drop</button>
            ]))}
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
        AutoComplete,
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

    it("renders portal configuration editors for each supported value type", async () => {
        api["portalConfigurationAPI.findAllPortalConfigurations"].mockResolvedValue([
            {id: 1, group_key: "general", setting_key: "array", value_type: "array", runtime_value: "A", default_value: "A,B", required_runtime: false},
            {
                id: 2,
                group_key: "general",
                setting_key: "boolean",
                value_type: "boolean",
                runtime_value: "false",
                default_value: "false",
                required_runtime: false
            },
            {id: 3, group_key: "general", setting_key: "date", value_type: "date", runtime_value: "2026-01-01", default_value: "", required_runtime: false},
            {
                id: 4,
                group_key: "general",
                setting_key: "email",
                value_type: "email",
                runtime_value: "a@example.com",
                default_value: "",
                required_runtime: false
            },
            {id: 5, group_key: "general", setting_key: "number", value_type: "number", runtime_value: "2", default_value: "1", required_runtime: false},
            {id: 6, group_key: "general", setting_key: "string", value_type: "string", runtime_value: "text", default_value: "", required_runtime: false},
            {id: 7, group_key: "general", setting_key: "timezone", value_type: "timezone", runtime_value: "UTC", default_value: "UTC", required_runtime: false},
            {
                id: 8,
                group_key: "membership",
                setting_key: "membership-type",
                value_type: "enum",
                runtime_value: "PERIODICAL",
                default_value: "DISABLED",
                required_runtime: false
            }
        ]);
        render(<PortalConfigurations/>);
        await flush();
        expect(screen.getByText("PortalConfigurations.general.title")).toBeInTheDocument();
        expect(screen.getAllByRole("button").length).toBeGreaterThan(2);
    });

    it("renders membership and organization administration views", async () => {
        api["membershipAPI.findByMemberId"].mockResolvedValue({
            id: 1, user_id: 2, username: "member", status: "ACTIVE", type: "YEAR",
            start_date: "2026-01-01", end_date: "2026-12-31"
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

    it("updates and deletes tags and creates a tag group from the tag editor", async () => {
        api["tagGroupAPI.findAll"].mockResolvedValue([{id: 1, code: "g", names: {en: "Group"}, type: "USER"}]);
        api["tagsAPI.findAll"].mockResolvedValue([{id: 2, code: "t", names: {en: "Tag"}, tag_group_id: 1}]);
        api["tagsAPI.update"].mockResolvedValue({});

        api["tagsAPI.delete"].mockResolvedValue(true);
        api["tagGroupAPI.create"].mockResolvedValue({id: 3, code: "new-group", names: {en: "New"}, type: "USER"});
        render(<AdminTags/>);
        await waitFor(() => expect(screen.getByTestId("table")).toBeInTheDocument());

        fireEvent.click(screen.getByText("common.button.edit"));
        fireEvent.click(screen.getByText("modal-ok"));
        await waitFor(() => expect(api["tagsAPI.update"]).toHaveBeenCalledWith(expect.objectContaining({
            id: 2, code: "x", names: {en: "X", fi: ""}
        })));

        fireEvent.click(screen.getByText("common.button.delete"));
        await waitFor(() => expect(api["tagsAPI.delete"]).toHaveBeenCalledWith(2));
        api["tagsAPI.delete"].mockResolvedValue(false);
        fireEvent.click(screen.getByText("common.button.delete"));
        await waitFor(() => expect(api["tagsAPI.delete"]).toHaveBeenCalledTimes(2));

        fireEvent.click(screen.getByText("common.button.edit"));
        fireEvent.click(screen.getByText("AdminTags.form.tagGroup.new-group"));
        fireEvent.click(screen.getAllByText("modal-ok").at(-1)!);
        await waitFor(() => expect(api["tagGroupAPI.create"]).toHaveBeenCalledWith(expect.objectContaining({
            id: 0, code: "x", names: {en: "X", fi: ""}
        })));
    });

    it("handles tag and group loading failures and delete failures", async () => {
        api["tagsAPI.findAll"].mockRejectedValue(new Error("tags unavailable"));
        api["tagGroupAPI.findAll"].mockRejectedValue(new Error("groups unavailable"));
        render(<AdminTags/>);
        await flush();
        api["tagsAPI.findAll"].mockResolvedValue([{id: 4, code: "broken", names: {en: "Broken"}}]);
        api["tagGroupAPI.findAll"].mockResolvedValue([]);
        api["tagsAPI.delete"].mockRejectedValue(new Error("delete failed"));
        render(<AdminTags/>);
        await waitFor(() => expect(screen.getAllByText("common.button.delete").length).toBeGreaterThan(0));
        fireEvent.click(screen.getAllByText("common.button.delete").at(-1)!);
        await waitFor(() => expect(api["tagsAPI.delete"]).toHaveBeenCalledWith(4));
    });

    it("reports tag-group creation failures and allows editor cancellation", async () => {
        api["tagsAPI.findAll"].mockResolvedValue([{id: 5, code: "tag", names: {en: "Tag"}}]);
        api["tagGroupAPI.findAll"].mockResolvedValue([]);
        api["tagGroupAPI.create"].mockRejectedValue(new Error("group create failed"));
        render(<AdminTags/>);
        await waitFor(() => expect(screen.getByTestId("table")).toBeInTheDocument());
        fireEvent.click(screen.getByText("common.button.edit"));
        fireEvent.click(screen.getByText("AdminTags.form.tagGroup.new-group"));
        fireEvent.click(screen.getAllByText("modal-ok").at(-1)!);
        await waitFor(() => expect(api["tagGroupAPI.create"]).toHaveBeenCalled());
        fireEvent.click(screen.getAllByText("modal-cancel").at(-1)!);
        fireEvent.click(screen.getAllByText("modal-cancel").at(-1)!);
    });

    it("renders certificate suggestions returned by the API", async () => {
        api["certificateAPI.findCertificateNames"].mockResolvedValue(["Open Water"]);
        api["certificateAPI.findOrganizations"].mockResolvedValue(["PADI"]);
        render(<AdminCertificateClassifications/>);

        fireEvent.change(screen.getAllByRole("textbox")[4], {target: {value: "open"}});
        await waitFor(() => expect(screen.getAllByText("Open Water").length).toBeGreaterThan(0));
        expect(api["certificateAPI.findCertificateNames"]).toHaveBeenCalledWith("open");

        fireEvent.change(screen.getAllByRole("textbox")[2], {target: {value: "padi"}});
        await waitFor(() => expect(screen.getAllByText("PADI").length).toBeGreaterThan(0));
        expect(api["certificateAPI.findOrganizations"]).toHaveBeenCalledWith("padi");
    });

    it("clears empty searches and reports suggestion failures", async () => {
        api["certificateAPI.findCertificateNames"].mockRejectedValue(new Error("search failed"));
        render(<AdminCertificateClassifications/>);

        fireEvent.change(screen.getAllByRole("textbox")[4], {target: {value: " "}});
        fireEvent.change(screen.getAllByRole("textbox")[4], {target: {value: "open"}});
        await waitFor(() => expect(api["certificateAPI.findCertificateNames"]).toHaveBeenCalledWith("open"));
    });

    it("renders each classification's persisted order", async () => {
        api["certificateClassificationAPI.findAll"].mockResolvedValue([
            {id: 1, order: 1, titles: {en: "First"}, description: "First description"},
            {id: 2, order: 3, titles: {en: "Third"}, description: "Third description"}
        ]);
        render(<AdminCertificateClassifications/>);

        await waitFor(() => expect(screen.getByTestId("table").textContent).toMatch(/1.*First.*3.*Third/));
        fireEvent.click(screen.getAllByText("row-drag-start")[0]);
        fireEvent.click(screen.getAllByText("row-drag-over")[0]);
        fireEvent.click(screen.getAllByText("row-drag-end")[0]);
        fireEvent.click(screen.getAllByText("row-drag-start")[0]);
        fireEvent.click(screen.getAllByText("row-drop")[1]);
    });

    it("creates, reorders, edits, and deletes classifications", async () => {
        api["certificateClassificationAPI.findAll"].mockResolvedValue([
            {id: 1, order: 1, titles: {en: "First"}, description: "First description"},
            {id: 2, order: 2, titles: {en: "Second"}, description: "Second description"}
        ]);
        api["certificateClassificationAPI.create"].mockResolvedValue({});
        api["certificateClassificationAPI.update"].mockResolvedValue({});
        api["certificateClassificationAPI.delete"].mockResolvedValue(true);
        api["certificateClassificationAPI.reorder"].mockResolvedValue(true);
        render(<AdminCertificateClassifications/>);
        await waitFor(() => expect(screen.getByText("First")).toBeInTheDocument());

        fireEvent.click(screen.getByText("AdminCertificateClassifications.button.add"));
        fireEvent.click(screen.getByText("modal-ok"));
        await waitFor(() => expect(api["certificateClassificationAPI.create"]).toHaveBeenCalledWith(expect.objectContaining({
            id: null, titles: {en: "Title", fi: ""}, description: "Description"
        })));

        fireEvent.click(screen.getByText("AdminCertificateClassifications.order.save"));
        await waitFor(() => expect(api["certificateClassificationAPI.reorder"]).toHaveBeenCalled());
        fireEvent.click(screen.getAllByText("common.button.edit")[0]);
        fireEvent.click(screen.getByText("modal-ok"));
        await waitFor(() => expect(api["certificateClassificationAPI.update"]).toHaveBeenCalled());
        fireEvent.click(screen.getAllByText("common.button.delete")[0]);
        await waitFor(() => expect(api["certificateClassificationAPI.delete"]).toHaveBeenCalledWith(1));
    });

    it("submits assignment and replacement forms with trimmed values", async () => {
        api["certificateAPI.updateClassification"].mockResolvedValue({});
        api["certificateAPI.replaceOrganizations"].mockResolvedValue({});
        api["certificateAPI.replaceCertificateNames"].mockResolvedValue({});
        render(<AdminCertificateClassifications/>);

        const submitButtons = screen.getAllByRole("button", {name: /AdminCertificateClassifications/});
        submitButtons.forEach(button => fireEvent.click(button));
        await waitFor(() => {
            expect(api["certificateAPI.updateClassification"]).toHaveBeenCalledWith({
                certificate_id: 7, certificate_names: ["Open Water"], classification_id: 2
            });
            expect(api["certificateAPI.replaceOrganizations"]).toHaveBeenCalledWith({
                existing_values: ["old"], new_value: "new"
            });
            expect(api["certificateAPI.replaceCertificateNames"]).toHaveBeenCalledWith({
                existing_values: ["old"], new_value: "new"
            });
        });
    });

    it("reports classification operation failures and unsuccessful deletes", async () => {
        api["certificateClassificationAPI.findAll"].mockResolvedValue([
            {id: 9, order: 1, titles: {en: "Existing"}, description: ""}
        ]);
        api["certificateClassificationAPI.create"].mockRejectedValue(new Error("create failed"));
        api["certificateClassificationAPI.update"].mockRejectedValue(new Error("update failed"));
        api["certificateClassificationAPI.delete"].mockResolvedValue(false);
        api["certificateClassificationAPI.reorder"].mockRejectedValue(new Error("reorder failed"));
        render(<AdminCertificateClassifications/>);
        await waitFor(() => expect(screen.getByText("Existing")).toBeInTheDocument());

        fireEvent.click(screen.getByText("AdminCertificateClassifications.button.add"));
        fireEvent.click(screen.getByText("modal-ok"));
        await waitFor(() => expect(api["certificateClassificationAPI.create"]).toHaveBeenCalled());

        fireEvent.click(screen.getByText("common.button.edit"));
        fireEvent.click(screen.getByText("modal-ok"));
        await waitFor(() => expect(api["certificateClassificationAPI.update"]).toHaveBeenCalled());

        fireEvent.click(screen.getByText("common.button.delete"));
        await waitFor(() => expect(api["certificateClassificationAPI.delete"]).toHaveBeenCalledWith(9));
        fireEvent.click(screen.getByText("AdminCertificateClassifications.order.save"));
        await waitFor(() => expect(api["certificateClassificationAPI.reorder"]).toHaveBeenCalled());
    });

    it("handles classification loading and deletion exceptions", async () => {
        api["certificateClassificationAPI.findAll"].mockRejectedValue(new Error("classification load failed"));
        render(<AdminCertificateClassifications/>);
        await flush();
        expect(api["certificateClassificationAPI.findAll"]).toHaveBeenCalled();

        api["certificateClassificationAPI.findAll"].mockResolvedValue([
            {id: 10, order: 1, titles: {en: "Delete me"}, description: ""}
        ]);
        api["certificateClassificationAPI.delete"].mockRejectedValue(new Error("delete failed"));
        render(<AdminCertificateClassifications/>);
        await waitFor(() => expect(screen.getByText("Delete me")).toBeInTheDocument());
        fireEvent.click(screen.getByText("common.button.delete"));
        await waitFor(() => expect(api["certificateClassificationAPI.delete"]).toHaveBeenCalledWith(10));
    });

    it("reports assignment, replacement, and suggestion failures", async () => {
        api["certificateAPI.updateClassification"].mockRejectedValue(new Error("assignment failed"));
        api["certificateAPI.replaceOrganizations"].mockRejectedValue(new Error("organization failed"));
        api["certificateAPI.replaceCertificateNames"].mockRejectedValue(new Error("name failed"));
        api["certificateAPI.findCertificateNames"].mockRejectedValue(new Error("suggestion failed"));
        render(<AdminCertificateClassifications/>);

        const submitButtons = screen.getAllByRole("button", {name: /AdminCertificateClassifications/});
        submitButtons.forEach(button => fireEvent.click(button));
        fireEvent.change(screen.getAllByRole("textbox")[4], {target: {value: " "}});
        fireEvent.change(screen.getAllByRole("textbox")[4], {target: {value: "term"}});
        await waitFor(() => expect(api["certificateAPI.findCertificateNames"]).toHaveBeenCalledWith("term"));
        expect(api["certificateAPI.updateClassification"]).toHaveBeenCalled();
        expect(api["certificateAPI.replaceOrganizations"]).toHaveBeenCalled();
        expect(api["certificateAPI.replaceCertificateNames"]).toHaveBeenCalled();
    });
});
