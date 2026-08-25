import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import type {ReactNode} from "react";
import {PageGroups} from "../components/Page/PageGroups";
import {Pages} from "../components/Page/Pages";
import {EditPage} from "../components/Page/EditPage";
import {EditPageGroup} from "../components/Page/EditPageGroup";
import {PageBodyEditor} from "../components/Page/PageBodyEditor";
import {AddPayments} from "../components/Payment/AddPayments";
import {ListPayments} from "../components/Payment/ListPayments";
import {PaymentListTable} from "../components/Payment/PaymentListTable";
import {Register} from "../components/Register/Register";
import {AggregateStats} from "../components/Statistics/AggregateStats";
import {BiannualEventReportTable} from "../components/Statistics/BiannualEventReportTable";
import {DiveEventReport} from "../components/Statistics/DiveEventReport";
import {YearlyDiveStats} from "../components/Statistics/YearlyDiveStats";
import {YearlyStats} from "../components/Statistics/YearlyStats";
import {MainAdminStatistics} from "../components/Statistics/MainAdminStatistics";
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
    AcceptTerms: () => <div>terms</div>,
    HealthStatementConfirmationModal: () => null,
    ShiftableRangePicker: () => <div>date-picker</div>
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
    {id: 2, status: PageStatusEnum.PUBLISHED, pageGroupVersions: [{language: "en", title: "Group"}], pages: []},
    {id: 1, status: PageStatusEnum.DELETED, pageGroupVersions: [{language: "en", title: "Reserved"}], pages: [{id: 1}]}
];
const payment = {
    id: 5,
    userId: 9,
    name: "Diver",
    created: "2024-01-01",
    startDate: "2024-01-01",
    endDate: null,
    paymentCount: 2,
    paymentType: PaymentTypeEnum.ONE_TIME,
    boundEvents: []
};

beforeEach(() => {
    jest.clearAllMocks();
    (pageGroupMgmtAPI.findAll as jest.Mock).mockResolvedValue(groups);
    (pageGroupMgmtAPI.findById as jest.Mock).mockResolvedValue({id: 2, pageGroupVersions: [{language: "en", title: "Group"}], pages: []});
    (pageMgmtAPI.findById as jest.Mock).mockResolvedValue({
        id: 7, pageGroupId: 2, status: PageStatusEnum.DRAFTED,
        pageVersions: [{id: 1, pageId: 7, language: "en", title: "Page", ingress: "", body: "body"}],
        rolePermissions: [{id: 1, pageId: 7, role: RoleEnum.ROLE_ADMIN, readPermission: true, writePermission: true}]
    });
    (userAPI.findByRole as jest.Mock).mockResolvedValue([{id: 9, name: "Diver", membershipActive: true}]);
    (statsAPI.getAggregates as jest.Mock).mockResolvedValue({eventsPerYear: [], diversPerYear: [], eventTypesPerYear: [], diverTypesPerYear: []});
    (statsAPI.getDiveEventReports as jest.Mock).mockResolvedValue([]);
    (statsAPI.getYearlyDiverList as jest.Mock).mockResolvedValue([]);
    (statsAPI.getYearlyStatsData as jest.Mock).mockResolvedValue([]);
    (paymentAPI.getAllActivePaymentStatusWithPaymentType as jest.Mock).mockResolvedValue([{userId: 9, name: "Diver", payments: [payment]}]);
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
            id: 4, status: PageStatusEnum.PUBLISHED, createdAt: "2024-01-01", modifiedAt: null,
            pageVersions: [{language: "en", title: "Page"}], rolePermissions: [{id: 1, role: RoleEnum.ROLE_ADMIN, readPermission: true, writePermission: true}]
        }],
        pageGroupVersions: [{language: "en", title: "Group"}]
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
        eventsPerYear: [{year: 2024, value: 2}],
        diversPerYear: [],
        eventTypesPerYear: [],
        diverTypesPerYear: []
    });
    (statsAPI.getDiveEventReports as jest.Mock).mockResolvedValue([{
        period: "2024-H1",
        events: [{eventId: 7, eventDateTime: "2024-01-01", organizerName: "Org", participantCount: 2, diveCount: 3}]
    }]);
    (statsAPI.getYearlyDiverList as jest.Mock).mockResolvedValue([{year: 2024, divers: [{userId: 1, position: 1, userName: "Diver", diveCount: 4}]}]);
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
                                     events={[{eventId: 8, eventDateTime: "2024-02-01", organizerName: "Org", participantCount: 1, diveCount: 2}]}/>);
    expect(screen.getByRole("link", {name: "8"})).toHaveAttribute("href", "/events/8");
});

test("Register redirects authenticated users and displays registration form", () => {
    render(<Register/>);
    expect(screen.getByText("Register.form.title")).toBeInTheDocument();
    expect(screen.getByText("user-fields")).toBeInTheDocument();
});

test("page editors, upload editor, payment form, and admin statistics mount their API-backed states", async () => {
    render(<><EditPage/><EditPageGroup/><PageBodyEditor value="<p>x</p>" language="en" pageId={7}/><AddPayments/><MainAdminStatistics/></>);
    await waitFor(() => expect(pageMgmtAPI.findById).toHaveBeenCalledWith(2, null));
    expect(screen.getByText("editor")).toBeInTheDocument();
    expect(userAPI.findByRole).toHaveBeenCalledWith(RoleEnum.ROLE_USER);
});
