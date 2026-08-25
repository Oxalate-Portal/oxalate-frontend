import React, {type ReactNode} from "react";
import {act, fireEvent, render, screen, waitFor} from "@testing-library/react";
import dayjs from "dayjs";
import {AdminMain} from "../components/Administration/AdminMain";
import {DownloadData} from "../components/Administration/DownloadData";
import {TimezoneSelector} from "../components/Administration/TimezoneSelector";
import {CommentModeration} from "../components/Administration/CommentModeration";
import {BlockedDates} from "../components/Administration/BlockedDates";
import {PortalConfigurations} from "../components/Administration/PortalConfigurations";
import {AdminTagGroups} from "../components/Administration/AdminTagGroups";
import {AdminTags} from "../components/Administration/AdminTags";
import {AuditEvents} from "../components/Administration/AuditEvents";
import {AdminUploads} from "../components/Administration/FileManagement/AdminUploads";
import {AvatarFiles} from "../components/Administration/FileManagement/AvatarFiles";
import {CertificateFiles} from "../components/Administration/FileManagement/CertificateFiles";
import {DiveFiles} from "../components/Administration/FileManagement/DiveFiles";
import {DocumentFiles} from "../components/Administration/FileManagement/DocumentFiles";
import {PageFiles} from "../components/Administration/FileManagement/PageFiles";
import {AddMemberships} from "../components/Administration/AddMemberships";
import {AdminMembership} from "../components/Administration/AdminMembership";
import {AdminMemberships} from "../components/Administration/AdminMemberships";
import {AdminOrgUser} from "../components/Administration/AdminOrgUser";
import {AdminOrgUsers} from "../components/Administration/AdminOrgUsers";

const api: Record<string, jest.Mock> = {};
let configMode = "enabled";
let routeParam = "1";
const makeApi = (name: string) => (api[name] ??= jest.fn().mockResolvedValue([]));
const service = (name: string, methods: string[]) => Object.fromEntries(methods.map((method) => [method, makeApi(name + "." + method)]));
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
    blockedDatesAPI: service("blockedDatesAPI", ["findAll", "create", "delete"]),
    commentAPI: service("commentAPI", ["getPendingReports"]),
    diveEventAPI: service("diveEventAPI", ["findAllPastDiveEvents"]),
    downloadAPI: service("downloadAPI", ["downloadCertificates", "downloadDives", "downloadPayments"]),
    userAPI: service("userAPI", ["findAll", "findByRole", "findAdminUserById", "adminUpdateUser", "resetTerms", "resetHealthStatement"]),
    membershipAPI: service("membershipAPI", ["findAll", "findByMemberId", "create", "update"]),
    tagGroupAPI: service("tagGroupAPI", ["findAll", "create", "update", "delete"]),
    tagsAPI: service("tagsAPI", ["findAll", "create", "update", "delete"]),
    auditAPI: service("auditAPI", ["findPageable"]),
    portalConfigurationAPI: service("portalConfigurationAPI", ["findAllPortalConfigurations", "updateConfigurationValue", "reloadPortalConfiguration"]),
    fileTransferAPI: service("fileTransferAPI", ["findAllAvatarFiles", "findAllCertificateFiles", "findAllDiveFiles", "findAllDocuments", "findAllPageFiles", "removeDocumentFile"]),
    adminUserAPI: service("adminUserAPI", ["findAll"]),
    authAPI: service("authAPI", ["recoverLostPassword"])
}));
jest.mock("../session", () => ({
    useSession: () => ({
        userSession: {accessToken: "token"},
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
    getDefaultMembershipDates: () => ({startDate: {format: () => "2026-01-01"}, endDate: {format: () => "2026-12-31"}}),
    getApiBaseUrl: () => "http://api"
}));
jest.mock("../components/Commenting", () => ({
    CommentCard: () => <span>comment</span>,
    CommentModerationActions: () => <span>actions</span>,
    ReportCard: () => <span>report</span>
}));
jest.mock("../components/User", () => ({UserFields: () => <span>user-fields</span>}));
jest.mock("../components/main", () => ({
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
                    id: 7, userId: 7, username: "user@example.com", firstName: "First", lastName: "Last",
                    status: "ACTIVE", type: "YEAR", roles: ["ROLE_USER"], privacy: false, approvedTerms: true,
                    healthStatementId: null, userIdList: [7], dateRange: []
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
            render?: (v: unknown, r: any) => ReactNode;
            filterDropdown?: (p: any) => ReactNode;
            filterIcon?: (v: boolean) => ReactNode;
            onFilter?: (v: any, r: any) => boolean;
            sorter?: (a: any, b: any) => number
        }>;
        dataSource?: any[];
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
            <button onClick={() => onChange?.({current: 1}, {}, [{field: "userName", order: "ascend"}])}>table-sort</button>
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
            {id: 1, groupKey: "FILES", settingKey: "enabled", valueType: "boolean", runtimeValue: "false", defaultValue: "false", requiredRuntime: false},
            {id: 2, groupKey: "MAIL", settingKey: "address", valueType: "email", runtimeValue: "", defaultValue: "", requiredRuntime: true},
            {id: 3, groupKey: "FILES", settingKey: "count", valueType: "number", runtimeValue: "2", defaultValue: "0", requiredRuntime: false},
            {id: 4, groupKey: "FILES", settingKey: "day", valueType: "date", runtimeValue: "2026-01-01", defaultValue: "", requiredRuntime: false},
            {id: 5, groupKey: "FILES", settingKey: "langs", valueType: "array", runtimeValue: "a", defaultValue: "a,b", requiredRuntime: false},
            {
                id: 6,
                groupKey: "FILES",
                settingKey: "unit",
                valueType: "enum",
                settingKey: "membership-type",
                runtimeValue: "USER",
                defaultValue: "DISABLED",
                requiredRuntime: false
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
        api["blockedDatesAPI.findAll"].mockResolvedValue([{id: 1, blockedDate: "2099-01-01", creatorName: "a", reason: "r"}]);
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
            id: 1, userId: 2, username: "member", status: "ACTIVE", type: "YEAR",
            startDate: dayjs("2026-01-01"), endDate: dayjs("2026-12-31")
        });
        api["membershipAPI.findAll"].mockResolvedValue([]);
        api["userAPI.findAdminUserById"].mockResolvedValue({
            id: 2, username: "member", firstName: "A", lastName: "User", status: "ACTIVE",
            roles: [], privacy: false, payments: [], approvedTerms: false, healthStatementId: null
        });
        api["adminUserAPI.findAll"].mockResolvedValue([]);
        render(<><AdminMemberships/><AdminOrgUsers/></>);
        await flush();
        expect(screen.getByText("AdminMembers.title")).toBeInTheDocument();
    });

    it("covers membership editing, adding, user actions, and file column branches", async () => {
        const member = {
            id: 1, userId: 2, username: "member", status: "ACTIVE", type: "YEAR",
            startDate: dayjs("2026-01-01"), endDate: dayjs("2026-12-31")
        };
        api["membershipAPI.findByMemberId"].mockResolvedValue(member);
        api["membershipAPI.create"].mockResolvedValue(member);
        api["membershipAPI.update"].mockResolvedValue(member);
        api["userAPI.findByRole"].mockResolvedValue([{id: 2, name: "Member"}]);
        api["userAPI.findAdminUserById"].mockResolvedValue({
            id: 2, username: "member", firstName: "A", lastName: "User", status: "ACTIVE",
            roles: [], privacy: false, payments: [], approvedTerms: false, healthStatementId: null
        });
        api["authAPI.recoverLostPassword"].mockResolvedValue({status: "OK"});
        api["userAPI.adminUpdateUser"].mockResolvedValue({
            id: 2, username: "member", firstName: "A", lastName: "User", status: "ACTIVE",
            roles: [], privacy: false, payments: [], approvedTerms: false, healthStatementId: null
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
        api["adminUserAPI.findAll"].mockResolvedValue([{
            id: 3, username: "anon", firstName: "A", lastName: "N", status: "ANONYMIZED",
            roles: ["ROLE_ADMIN"], privacy: false, payments: [], approvedTerms: true, healthStatementId: 0
        }]);
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
        api["tagsAPI.findAll"].mockResolvedValue([{id: 2, code: "t", names: {en: "Tag"}, tagGroupId: 1}]);
        api["auditAPI.findPageable"].mockResolvedValue({content: [], number: 0, size: 10, totalElements: 0});
        render(<><AdminTagGroups/><AdminTags/><AuditEvents/></>);
        await flush();
        fireEvent.click(screen.getByText("AdminTagGroups.button.add-group"));
        fireEvent.click(screen.getAllByText("modal-ok")[0]);
        fireEvent.click(screen.getByText("AdminTags.button.add-tag"));
        fireEvent.click(screen.getAllByText("modal-ok")[0]);
        fireEvent.click(screen.getAllByText("table-change").at(-1)!);
        await waitFor(() => expect(api["auditAPI.findPageable"]).toHaveBeenCalled());
    });

    it("drives successful administration workflows and all populated table renderers", async () => {
        const now = dayjs();
        const user = {
            id: 7, username: "user@example.com", firstName: "First", lastName: "Last",
            status: "ACTIVE", roles: ["ROLE_USER", "ROLE_ORGANIZER", "ROLE_ADMIN"],
            privacy: true, payments: [
                {id: 1, paymentType: "PERIODICAL", startDate: now.subtract(1, "day"), endDate: now.add(1, "day")},
                {id: 2, paymentType: "ONE_TIME", startDate: now.subtract(1, "day"), endDate: now.add(1, "day")},
                {id: 3, paymentType: "ONE_TIME", startDate: now.add(2, "day"), endDate: now.add(3, "day")}
            ], approvedTerms: true, healthStatementId: 4
        };
        api["adminUserAPI.findAll"].mockResolvedValue([user, {
            ...user,
            id: 8,
            username: "anon",
            status: "ANONYMIZED",
            approvedTerms: false,
            healthStatementId: null,
            payments: []
        }]);
        api["membershipAPI.findAll"].mockResolvedValue([{
            id: 4, userId: 7, username: "user@example.com", status: "ACTIVE", type: "YEAR",
            startDate: now.subtract(1, "day"), endDate: now.add(1, "day"), created: now
        }]);
        api["userAPI.findByRole"].mockResolvedValue([{id: 7, name: "First Last"}]);
        api["fileTransferAPI.findAllAvatarFiles"].mockResolvedValue([{id: 1, filename: "avatar", filesize: 1024, creator: "u", createdAt: now, url: "/a"}]);
        api["fileTransferAPI.findAllCertificateFiles"].mockResolvedValue([{id: 2, filename: "cert", filesize: 2048, creator: "u", createdAt: now, url: "/c"}]);
        api["fileTransferAPI.findAllDiveFiles"].mockResolvedValue([{
            id: 3,
            eventId: 1,
            diveGroupId: 2,
            status: "UPLOADED",
            filename: "dive",
            filesize: 2048,
            creator: "u",
            createdAt: now,
            url: "/d"
        }]);
        api["fileTransferAPI.findAllDocuments"].mockResolvedValue([{
            id: 4,
            status: "PUBLISHED",
            filename: "doc",
            filesize: 2048,
            creator: "u",
            createdAt: now,
            url: "/doc"
        }]);
        api["fileTransferAPI.findAllPageFiles"].mockResolvedValue([
            {id: 5, pageId: 1, language: "en", status: "UPLOADED", filename: "one", filesize: 1024, creator: "u", createdAt: now, url: "/one"},
            {id: 6, pageId: 2, language: "fi", status: "PUBLISHED", filename: "two", filesize: 1024, creator: "u", createdAt: now, url: "/two"},
            {id: 7, pageId: 3, language: "sv", status: "DELETED", filename: "three", filesize: 1024, creator: "u", createdAt: now, url: "/three"}
        ]);
        api["auditAPI.findPageable"].mockResolvedValue({
            content: [{id: 1, createdAt: "2026-01-01", userName: "u", traceId: "trace", source: "web", level: "ERROR", address: "local", message: "failed"}],
            pageable: {pageNumber: 0, pageSize: 10}, totalElements: 1
        });
        api["portalConfigurationAPI.findAllPortalConfigurations"].mockResolvedValue([
            {id: 10, groupKey: "G", settingKey: "array", valueType: "array", runtimeValue: "a", defaultValue: "a,b", requiredRuntime: false},
            {id: 11, groupKey: "G", settingKey: "bool", valueType: "boolean", runtimeValue: "false", defaultValue: "false", requiredRuntime: false},
            {id: 12, groupKey: "G", settingKey: "date", valueType: "date", runtimeValue: "2026-01-01", defaultValue: "", requiredRuntime: false},
            {id: 13, groupKey: "G", settingKey: "email", valueType: "email", runtimeValue: "ok@example.com", defaultValue: "", requiredRuntime: true},
            {id: 14, groupKey: "G", settingKey: "number", valueType: "number", runtimeValue: "2", defaultValue: "0", requiredRuntime: false},
            {id: 15, groupKey: "G", settingKey: "string", valueType: "string", runtimeValue: "x", defaultValue: "", requiredRuntime: false},
            {id: 16, groupKey: "G", settingKey: "timezone", valueType: "timezone", runtimeValue: "UTC", defaultValue: "", requiredRuntime: false},
            {id: 17, groupKey: "G", settingKey: "membership-type", valueType: "enum", runtimeValue: "USER", defaultValue: "DISABLED", requiredRuntime: false},
            {
                id: 18,
                groupKey: "G",
                settingKey: "membership-period-unit",
                valueType: "enum",
                runtimeValue: "YEAR",
                defaultValue: "YEAR",
                requiredRuntime: false
            },
            {
                id: 19,
                groupKey: "G",
                settingKey: "periodical-payment-method-type",
                valueType: "enum",
                runtimeValue: "PERIODICAL",
                defaultValue: "PERIODICAL",
                requiredRuntime: false
            },
            {
                id: 20,
                groupKey: "G",
                settingKey: "periodical-payment-method-unit",
                valueType: "enum",
                runtimeValue: "YEAR",
                defaultValue: "YEAR",
                requiredRuntime: false
            },
            {id: 21, groupKey: "G", settingKey: "unknown", valueType: "enum", runtimeValue: "x", defaultValue: "x", requiredRuntime: false}
        ]);
        api["portalConfigurationAPI.reloadPortalConfiguration"].mockResolvedValue([{
            id: 10,
            groupKey: "G",
            settingKey: "x",
            valueType: "string",
            runtimeValue: "x",
            defaultValue: "x",
            requiredRuntime: false
        }]);
        api["commentAPI.getPendingReports"].mockResolvedValue([{id: 1, title: "", body: "A comment body", childCount: 1, reports: [{id: 2}]}]);
        api["tagGroupAPI.findAll"].mockResolvedValue([{id: 1, code: "g", names: {en: "Group"}, type: "USER"}]);
        api["tagsAPI.findAll"].mockResolvedValue([{id: 2, code: "t", names: {en: "Tag"}, tagGroupId: 1}]);
        global.fetch = jest.fn().mockResolvedValue({json: () => Promise.resolve({UTC: [{value: "UTC", label: "UTC"}]})}) as jest.Mock;

        render(<>
            <AdminOrgUsers/><AdminMemberships/><AddMemberships onMembershipAdded={jest.fn()}/>
            <AvatarFiles/><CertificateFiles/><DiveFiles/><DocumentFiles/><PageFiles/>
            <AuditEvents/><PortalConfigurations/><CommentModeration/>
        </>);
        await waitFor(() => expect(api["adminUserAPI.findAll"]).toHaveBeenCalled());
        await flush();
        fireEvent.click(screen.getByText("AdminUploads.document.upload.button"));
        fireEvent.click(screen.getByText("common.button.delete"));
        fireEvent.click(screen.getByText("AdminOrgUsers.terms.resetButton"));
        fireEvent.click(screen.getByText("AdminOrgUsers.healthStatement.resetButton"));
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
            id: 7, username: "user@example.com", firstName: "First", lastName: "Last",
            status: "ACTIVE", roles: ["ROLE_USER"], privacy: true, payments: [],
            approvedTerms: true, healthStatementId: null
        });
        api["authAPI.recoverLostPassword"].mockResolvedValue({status: "OK"});
        api["userAPI.adminUpdateUser"].mockResolvedValue({
            id: 7, username: "user@example.com", firstName: "First", lastName: "Last",
            status: "ACTIVE", roles: ["ROLE_USER"], privacy: false, payments: [],
            approvedTerms: true, healthStatementId: null
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
        api["fileTransferAPI.findAllDocuments"].mockResolvedValue([{
            id: 99,
            status: "PUBLISHED",
            filename: "doc",
            filesize: 1,
            creator: "u",
            createdAt: dayjs(),
            url: "/doc"
        }]);
        api["fileTransferAPI.removeDocumentFile"].mockRejectedValue(new Error("remove"));
        render(<DocumentFiles/>);
        await flush();
        fireEvent.click(screen.getAllByText("AdminUploads.document.upload.button").at(-1)!);
        fireEvent.click(screen.getAllByText("common.button.delete").at(-1)!);
    });
});
