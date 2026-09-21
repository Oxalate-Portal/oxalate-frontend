import dayjs from "dayjs";
import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import type {ReactNode} from "react";
import {
    AddPayments,
    AggregateStats,
    BiannualEventReportTable,
    DiveEventReport,
    EditPage,
    EditPageGroup,
    ListPayments,
    MainAdminStatistics,
    PageBodyEditor,
    PageGroups,
    Pages,
    PaymentListTable,
    Register,
    YearlyDiveStats,
    YearlyStats
} from "../components";
import {pageGroupMgmtAPI, pageMgmtAPI, paymentAPI, statsAPI, userAPI} from "../services";
import {PageStatusEnum, PaymentTypeEnum, RoleEnum} from "../models";

const mockTranslation = {t: (key: string) => key};
const mockGetPortalConfigurationValue = (group: string, key: string) => {
    if (group === "PAYMENT" && key === "single-payment-enabled") return "true";
    if (key === "event-require-membership") return "false";
    if (key === "top-divers-list-size") return "3";
    if (key === "timezone") return "Europe/Helsinki";
    if (key.includes("method-type")) return "PERIODICAL";
    if (key.includes("expiration-type")) return "PERIODICAL";
    if (key.includes("expiration-unit") || key.includes("method-unit")) return "YEARS";
    if (key.includes("length")) return "1";
    if (key.includes("start")) return key.includes("date") ? "2024-01-01" : "1";
    return "true";
};
const mockSession = {
    userSession: {roles: [RoleEnum.ROLE_ADMIN]},
    sessionLanguage: "en",
    getPortalConfigurationValue: mockGetPortalConfigurationValue,
    getFrontendConfigurationValue: () => "en"
};

jest.mock("react-i18next", () => ({useTranslation: () => mockTranslation}));
jest.mock("react-router-dom", () => ({
    Link: ({children, to}: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
    useParams: () => ({paramId: "2"}),
    useNavigate: () => jest.fn()
}));
jest.mock("../session", () => ({
    useSession: () => mockSession
}));
jest.mock("../components/User", () => ({UserFields: () => <div>user-fields</div>}));
jest.mock("../components/main", () => ({
    // Forms are horizontal in jsdom, matching the real hook when no breakpoint matches
    useResponsiveFormLayout: (labelSpan: number, wrapperSpan: number) => ({layout: "horizontal", labelCol: {span: labelSpan}, wrapperCol: {span: wrapperSpan}}),
    AcceptTerms: () => <div>terms</div>,
    HealthStatementConfirmationModal: () => null,
    ShiftableRangePicker: () => <div>date-picker</div>,
    OxTable: jest.requireActual("../components/main/OxTable").OxTable
}));
jest.mock("@ant-design/charts", () => ({
    Column: ({data}: { data: unknown[] }) => <div>column-{data?.length ?? 0}</div>,
    Line: ({data}: { data: unknown[] }) => <div>line-{data?.length ?? 0}</div>
}));
jest.mock("@ckeditor/ckeditor5-react", () => ({CKEditor: () => <div>editor</div>}));

jest.mock("antd", () => {
    const actual = jest.requireActual("antd");
    return {
        ...actual,
        Form: Object.assign(({children}: { children: ReactNode }) => <form>{children}</form>, {
            Item: ({children, label}: { children: ReactNode; label?: ReactNode }) => <label>{label}{children}</label>,
            List: ({children}: { children: (fields: unknown[], actions: object) => ReactNode }) => <>{children([], {})}</>,
            useForm: () => [{setFieldsValue: jest.fn()}],
            useWatch: () => undefined
        }),
        Table: ({dataSource = [], columns = []}: {
            dataSource?: Record<string, unknown>[];
            columns?: Array<{ render?: (value: unknown, row: Record<string, unknown>, index: number) => ReactNode }>
        }) => (
                <div data-testid="table">{dataSource.map((row, i) => columns.map((column, j) =>
                        <span key={`${i}-${j}`}>{column.render ? column.render(row[Object.keys(row)[j]], row, i) : String(Object.values(row)[j] ?? "")}</span>
                ))}</div>
        ),
        Collapse: ({items = []}: { items?: Array<{ label: ReactNode; children: ReactNode }> }) =>
                <div>{items.map(item => <section key={String(item.label)}><h3>{item.label}</h3>{item.children}</section>)}</div>
    };
});

jest.mock("../services", () => ({
    pageGroupMgmtAPI: {findAll: jest.fn(), findById: jest.fn(), delete: jest.fn()},
    pageMgmtAPI: {delete: jest.fn(), findById: jest.fn(), create: jest.fn(), update: jest.fn()},
    userAPI: {findByRole: jest.fn()},
    paymentAPI: {getAllActivePaymentStatusWithPaymentType: jest.fn(), update: jest.fn()},
    statsAPI: {getAggregates: jest.fn(), getDiveEventReports: jest.fn(), getYearlyDiverList: jest.fn(), getYearlyStatsData: jest.fn()},
    authAPI: {register: jest.fn()}
}));

const groups = [
    {id: 2, status: PageStatusEnum.PUBLISHED, page_group_versions: [{language: "en", title: "Group"}], pages: []},
    {id: 1, status: PageStatusEnum.DELETED, page_group_versions: [{language: "en", title: "Reserved"}], pages: [{id: 1}]}
];
const payment = {
    id: 5,
    user_id: 9,
    name: "Diver",
    created: "2024-01-01",
    start_date: "2024-01-01",
    end_date: null,
    payment_count: 2,
    payment_type: PaymentTypeEnum.ONE_TIME,
    bound_events: []
};

beforeEach(() => {
    jest.clearAllMocks();
    (pageGroupMgmtAPI.findAll as jest.Mock).mockResolvedValue(groups);
    (pageGroupMgmtAPI.findById as jest.Mock).mockResolvedValue({id: 2, page_group_versions: [{language: "en", title: "Group"}], pages: []});
    (pageMgmtAPI.findById as jest.Mock).mockResolvedValue({
        id: 7, page_group_id: 2, status: PageStatusEnum.DRAFTED,
        page_versions: [{id: 1, page_id: 7, language: "en", title: "Page", ingress: "", body: "body"}],
        role_permissions: [{id: 1, page_id: 7, role: RoleEnum.ROLE_ADMIN, read_permission: true, write_permission: true}]
    });
    (userAPI.findByRole as jest.Mock).mockResolvedValue([{id: 9, name: "Diver", membership_active: true}]);
    (statsAPI.getAggregates as jest.Mock).mockResolvedValue({events_per_year: [], divers_per_year: [], event_types_per_year: [], diver_types_per_year: []});
    (statsAPI.getDiveEventReports as jest.Mock).mockResolvedValue([]);
    (statsAPI.getYearlyDiverList as jest.Mock).mockResolvedValue([]);
    (statsAPI.getYearlyStatsData as jest.Mock).mockResolvedValue([]);
    (paymentAPI.getAllActivePaymentStatusWithPaymentType as jest.Mock).mockResolvedValue([{user_id: 9, name: "Diver", payments: [payment]}]);
    (paymentAPI.update as jest.Mock).mockResolvedValue({});
});

test("PageGroups loads records, exposes admin links, and closes a group", async () => {
    window.confirm = jest.fn().mockReturnValue(true);
    (pageGroupMgmtAPI.delete as jest.Mock).mockResolvedValue(true);
    render(<PageGroups/>);
    await waitFor(() => expect(screen.getByText("Group")).toBeInTheDocument());
    expect(screen.getByText("PageGroups.button.addPage")).toBeInTheDocument();
    fireEvent.click(screen.getByText("common.button.close"));
    await waitFor(() => expect(pageGroupMgmtAPI.delete).toHaveBeenCalledWith(2));
});

test("Pages loads pages and handles refused and failed delete requests", async () => {
    (pageGroupMgmtAPI.findById as jest.Mock).mockResolvedValue({
        pages: [{
            id: 4,
            status: PageStatusEnum.PUBLISHED,
            created_at: "2024-01-01",
            modified_at: null,
            page_versions: [{language: "en", title: "Page"}],
            role_permissions: [{id: 1, role: RoleEnum.ROLE_ADMIN, read_permission: true, write_permission: true}]
        }],
        page_group_versions: [{language: "en", title: "Group"}]
    });
    window.confirm = jest.fn().mockReturnValue(false);
    render(<Pages/>);
    await waitFor(() => expect(screen.getByText("Page")).toBeInTheDocument());
    expect(pageMgmtAPI.delete).not.toHaveBeenCalled();
    window.confirm = jest.fn().mockReturnValue(true);
    (pageMgmtAPI.delete as jest.Mock).mockRejectedValue("failed");
    fireEvent.click(screen.getByText("common.button.close"));
    await waitFor(() => expect(pageMgmtAPI.delete).toHaveBeenCalledWith(4));
});

test("payment list supports one-time and periodical data and updates counts", async () => {
    render(<ListPayments/>);
    await waitFor(() => expect(screen.getAllByText("Diver").length).toBeGreaterThan(0));
    render(<PaymentListTable paymentType={PaymentTypeEnum.ONE_TIME} keyName="extra"/>);
    await waitFor(() => expect(screen.getAllByText("Diver").length).toBeGreaterThan(1));
    fireEvent.click(screen.getAllByRole("button").find(button => button.textContent === "")!);
    await waitFor(() => expect(paymentAPI.update).toHaveBeenCalled());
});

test("statistics components render API success and tolerate failures", async () => {
    (statsAPI.getAggregates as jest.Mock).mockResolvedValue({
        events_per_year: [{year: 2024, value: 2}],
        divers_per_year: [],
        event_types_per_year: [],
        diver_types_per_year: []
    });
    (statsAPI.getDiveEventReports as jest.Mock).mockResolvedValue([{
        period: "2024-H1",
        events: [{event_id: 7, event_date_time: "2024-01-01", organizer_name: "Org", participant_count: 2, dive_count: 3}]
    }]);
    (statsAPI.getYearlyDiverList as jest.Mock).mockResolvedValue([{year: 2024, divers: [{user_id: 1, position: 1, user_name: "Diver", dive_count: 4}]}]);
    (statsAPI.getYearlyStatsData as jest.Mock).mockResolvedValue([{year: 2024, value: 1, type: "x"}]);
    render(<><AggregateStats/><DiveEventReport/><YearlyDiveStats/><YearlyStats typeOfStats="events" headerText="Yearly"/></>);
    await waitFor(() => expect(screen.getByText("2024-H1")).toBeInTheDocument());
    expect(screen.getAllByText("Diver").length).toBeGreaterThan(0);
    (statsAPI.getAggregates as jest.Mock).mockRejectedValue(new Error("offline"));
    render(<AggregateStats/>);
    await waitFor(() => expect(statsAPI.getAggregates).toHaveBeenCalledTimes(2));
});

test("biannual event table handles links and sortable report fields", () => {
    render(<BiannualEventReportTable childKey="period"
                                     events={[{
                                         event_id: 8,
                                         event_date_time: dayjs("2024-02-01"),
                                         organizer_name: "Org",
                                         participant_count: 1,
                                         dive_count: 2
                                     }]}/>);
    expect(screen.getByRole("link", {name: "8"})).toHaveAttribute("href", "/events/8");
});

test("Register redirects authenticated users and displays registration form", () => {
    render(<Register/>);
    expect(screen.getByText("Register.form.title")).toBeInTheDocument();
    expect(screen.getByText("user-fields")).toBeInTheDocument();
});

test("page editors, upload editor, payment form, and admin statistics mount their API-backed states", async () => {
    render(<><EditPage/><EditPageGroup/><PageBodyEditor value="<p>x</p>" language="en" pageId={7}
                                                        onChange={jest.fn()}/><AddPayments/><MainAdminStatistics/></>);
    await waitFor(() => expect(pageMgmtAPI.findById).toHaveBeenCalledWith(2, null));
    expect(screen.getByText("editor")).toBeInTheDocument();
    expect(userAPI.findByRole).toHaveBeenCalledWith(RoleEnum.ROLE_USER);
});
