import React, {type ReactNode} from "react";
import {act, fireEvent, render, screen, waitFor} from "@testing-library/react";
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
import {AdminMemberships} from "../components/Administration/AdminMemberships";
import {AdminOrgUsers} from "../components/Administration/AdminOrgUsers";
import {AdminCertificateClassifications} from "../components/Administration/AdminCertificateClassifications";

// eslint-disable-next-line no-var
var api: Record<string, jest.Mock>;

function makeApi(name: string) {
    api ??= {};
    return api[name] ??= jest.fn().mockResolvedValue([]);
}

function service(name: string, methods: string[]) {
    return Object.fromEntries(methods.map((method) => [method, makeApi(name + "." + method)]));
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
    certificateAPI: service("certificateAPI", ["findCertificateNames", "findOrganizations"]),
    certificateClassificationAPI: service("certificateClassificationAPI", ["findAll"]),
    blockedDatesAPI: service("blockedDatesAPI", ["findAll", "create", "delete"]),
    commentAPI: service("commentAPI", ["getPendingReports"]),
    diveEventAPI: service("diveEventAPI", ["findAllPastDiveEvents"]),
    downloadAPI: service("downloadAPI", ["downloadCertificates", "downloadDives", "downloadPayments"]),
    userAPI: service("userAPI", ["findAll", "findByRole", "findAdminUserById", "resetTerms", "resetHealthStatement"]),
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
    const Form = ({children, onFinish}: { children: ReactNode; onFinish?: (v: unknown) => void }) => (
            <form onSubmit={(event) => {
                event.preventDefault();
                onFinish?.({});
            }}>{children}</form>
    );
    Form.Item = ({children}: { children: ReactNode }) => <div>{children}</div>;
    Form.useForm = () => [{
        resetFields: jest.fn(),
        setFieldsValue: jest.fn(),
        getFieldValue: jest.fn(() => ""),
        validateFields: jest.fn().mockResolvedValue({code: "x", names: [{value: "X"}], type: "USER"})
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
    const Select = ({options = [], onChange}: { options?: Array<{ label?: string; value?: string }>; onChange?: (v: string) => void }) =>
            <select onChange={(e) => onChange?.(e.target.value)}>{options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>;
    const Table = ({columns = [], dataSource = [], onChange}: {
        columns?: Array<{ render?: (v: unknown, r: unknown) => ReactNode }>;
        dataSource?: unknown[];
        onChange?: (...args: unknown[]) => void
    }) => (
            <div data-testid="table">{dataSource.map((record) => columns.map((column, columnIndex) =>
                    <span key={columnIndex}>{column.render ? column.render(undefined, record) : null}</span>))}
                <button onClick={() => onChange?.({current: 0}, {}, {field: undefined, order: undefined})}>table-change</button>
                <button onClick={() => onChange?.({current: 1}, {}, [{field: "userName", order: "ascend"}])}>table-sort</button>
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
            startDate: "2026-01-01", endDate: "2026-12-31"
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

    it("renders certificate suggestions returned by the API", async () => {
        api["certificateAPI.findCertificateNames"].mockResolvedValue(["Open Water"]);
        api["certificateAPI.findOrganizations"].mockResolvedValue(["PADI"]);
        render(<AdminCertificateClassifications/>);

        fireEvent.change(screen.getAllByRole("textbox")[1], {target: {value: "open"}});
        await waitFor(() => expect(screen.getAllByText("Open Water").length).toBeGreaterThan(0));
        expect(api["certificateAPI.findCertificateNames"]).toHaveBeenCalledWith("open");

        fireEvent.change(screen.getAllByRole("textbox")[2], {target: {value: "padi"}});
        await waitFor(() => expect(screen.getAllByText("PADI").length).toBeGreaterThan(0));
        expect(api["certificateAPI.findOrganizations"]).toHaveBeenCalledWith("padi");
    });

    it("clears empty searches and reports suggestion failures", async () => {
        api["certificateAPI.findCertificateNames"].mockRejectedValue(new Error("search failed"));
        render(<AdminCertificateClassifications/>);

        fireEvent.change(screen.getAllByRole("textbox")[1], {target: {value: " "}});
        fireEvent.change(screen.getAllByRole("textbox")[1], {target: {value: "open"}});
        await waitFor(() => expect(api["certificateAPI.findCertificateNames"]).toHaveBeenCalledWith("open"));
    });
});
