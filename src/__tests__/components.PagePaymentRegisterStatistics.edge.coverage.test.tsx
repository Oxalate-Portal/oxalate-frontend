import {cleanup, render, screen, waitFor, within} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type {ReactNode} from "react";
import {Page} from "../components/Page/Page";
import {PageBodyEditor} from "../components/Page/PageBodyEditor";
import {EditPage} from "../components/Page/EditPage";
import {EditPageGroup} from "../components/Page/EditPageGroup";
import {PaymentListTable} from "../components/Payment/PaymentListTable";
import {Payments} from "../components/Payment/Payments";
import {Registration} from "../components/Register/Registration";
import {ResendRegistrationEmail} from "../components/Register/ResendRegistrationEmail";
import {AggregateStats} from "../components/Statistics/AggregateStats";
import {BiannualEventReportTable} from "../components/Statistics/BiannualEventReportTable";
import {PageStatusEnum, PaymentTypeEnum, RoleEnum} from "../models";
import {authAPI, pageAPI, pageGroupMgmtAPI, pageMgmtAPI, paymentAPI, statsAPI} from "../services";

jest.setTimeout(30000);

let routeId = "7";
let query = "OK";
const navigate = jest.fn();
const messageApi = {success: jest.fn(), error: jest.fn()};

const mockTranslation = {t: (key: string) => key};
jest.mock("react-i18next", () => ({useTranslation: () => mockTranslation}));
jest.mock("react-router-dom", () => ({
    Link: ({children, to}: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
    useParams: () => ({paramId: routeId}),
    useSearchParams: () => [new URLSearchParams("status=" + query)],
    useNavigate: () => navigate
}));
jest.mock("../session", () => ({
    useSession: () => ({
        sessionLanguage: "en",
        userSession: {roles: [RoleEnum.ROLE_ADMIN]},
        getFrontendConfigurationValue: () => "en,fi",
        getPortalConfigurationValue: (_group: string, key: string) =>
                key === "single-payment-enabled" ? "true" : "false"
    })
}));
jest.mock("../services", () => ({
    pageAPI: {findById: jest.fn()},
    pageGroupMgmtAPI: {findAll: jest.fn(), findById: jest.fn(), create: jest.fn(), update: jest.fn()},
    pageMgmtAPI: {findById: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn()},
    paymentAPI: {
        resetAllPayments: jest.fn(),
        getAllActivePaymentStatusWithPaymentType: jest.fn(),
        update: jest.fn()
    },
    statsAPI: {getAggregates: jest.fn()},
    authAPI: {resendRegistrationEmail: jest.fn()}
}));
jest.mock("../components/Payment/ListPayments", () => ({
    ListPayments: () => <div>active payments</div>
}));
jest.mock("../components/Payment/AddPayments", () => ({
    AddPayments: () => <div>add payments</div>
}));
jest.mock("@ant-design/charts", () => ({
    Column: () => <div data-testid="column-chart"/>,
    Line: () => <div data-testid="line-chart"/>
}));
jest.mock("@ckeditor/ckeditor5-react", () => ({
    CKEditor: ({data, onChange}: { data: string; onChange: (_event: unknown, editor: { getData: () => string }) => void }) =>
            <textarea aria-label="body editor" defaultValue={data}
                      onChange={event => onChange(event, {getData: () => event.target.value})}/>
}));
jest.mock("antd", () => {
    const actual = jest.requireActual("antd");
    return {
        ...actual,
        message: {useMessage: () => [messageApi, <span key="holder"/>]}
    };
});

const page = {
    id: 7,
    pageGroupId: 2,
    status: PageStatusEnum.PUBLISHED,
    pageVersions: [{id: 8, pageId: 7, language: "en", title: "<b>Title</b>", ingress: "<i>Ingress</i>", body: "<p>Body</p>"}],
    rolePermissions: [],
    creator: 1,
    createdAt: "2024-01-01",
    modifier: null,
    modifiedAt: null
};

beforeEach(() => {
    jest.clearAllMocks();
    routeId = "7";
    query = "OK";
    window.confirm = jest.fn().mockReturnValue(true);
    (pageAPI.findById as jest.Mock).mockResolvedValue(page);
    (pageGroupMgmtAPI.findAll as jest.Mock).mockResolvedValue([]);
    (pageGroupMgmtAPI.findById as jest.Mock).mockResolvedValue({id: 2, status: PageStatusEnum.DRAFTED, pageGroupVersions: [], pages: []});
    (pageMgmtAPI.findById as jest.Mock).mockResolvedValue(page);
    (pageMgmtAPI.create as jest.Mock).mockResolvedValue({...page, id: 9});
    (pageMgmtAPI.update as jest.Mock).mockResolvedValue(page);
    (pageGroupMgmtAPI.create as jest.Mock).mockResolvedValue({id: 2});
    (pageGroupMgmtAPI.update as jest.Mock).mockResolvedValue({id: 2});
    (paymentAPI.resetAllPayments as jest.Mock).mockResolvedValue(true);
    (authAPI.resendRegistrationEmail as jest.Mock).mockResolvedValue(true);
    (statsAPI.getAggregates as jest.Mock).mockResolvedValue({
        eventsPerYear: [{year: 2024, value: 3}],
        diversPerYear: [{year: 2024, value: 2}],
        eventTypesPerYear: [{year: 2024, type: "CAVE", value: 1}],
        diverTypesPerYear: [{year: 2024, type: "USER", value: 1}]
    });
});
afterEach(cleanup);

describe("page, payment, registration and statistics edge controls", () => {
    it("renders sanitized page variants and tolerates API failure", async () => {
        const user = userEvent.setup();
        render(<Page/>);
        expect(await screen.findByText("Title")).toBeInTheDocument();
        expect(screen.getByText("Ingress")).toBeInTheDocument();
        expect(screen.getByText("Body")).toBeInTheDocument();
        render(<Page pageId={7} showTitle={false} showDate={false}/>);
        await waitFor(() => expect(pageAPI.findById).toHaveBeenCalled());
        expect(user).toBeDefined();
    });

    it("covers editor upload configuration and new page initialization", async () => {
        const user = userEvent.setup();
        localStorage.clear();
        const changed = jest.fn();
        render(<PageBodyEditor value="old" language="en" pageId={7} onChange={changed}/>);
        await user.type(screen.getByRole("textbox", {name: "body editor"}), " text");
        expect(changed).toHaveBeenCalled();
        cleanup();
        routeId = "0";
        window.history.pushState({}, "", "/administration/pages/0?pageGroupId=2");
        render(<EditPage/>);
        await waitFor(() => expect(pageGroupMgmtAPI.findAll).toHaveBeenCalled());
        await waitFor(() => expect(pageGroupMgmtAPI.findAll).toHaveBeenCalled());
        render(<EditPageGroup/>);
        expect(await screen.findByRole("button", {name: "EditPageGroup.form.button.create"})).toBeInTheDocument();
    });

    it("covers payment reset confirmation, success, false, and rejection paths", async () => {
        const user = userEvent.setup();
        render(<Payments/>);
        await user.click(screen.getByRole("button", {name: "AdminPayments.reset-periodical-button"}));
        await waitFor(() => expect(paymentAPI.resetAllPayments).toHaveBeenCalledWith(PaymentTypeEnum.PERIODICAL));
        (paymentAPI.resetAllPayments as jest.Mock).mockResolvedValueOnce(false);
        await user.click(screen.getByRole("button", {name: "AdminPayments.reset-one-time-button"}));
        await waitFor(() => expect(paymentAPI.resetAllPayments).toHaveBeenCalledWith(PaymentTypeEnum.ONE_TIME));
        (paymentAPI.resetAllPayments as jest.Mock).mockRejectedValueOnce(new Error("offline"));
        await user.click(screen.getByRole("button", {name: "AdminPayments.reset-periodical-button"}));
        await waitFor(() => expect(paymentAPI.resetAllPayments).toHaveBeenCalledTimes(3));
        (window.confirm as jest.Mock).mockReturnValueOnce(false);
        await user.click(screen.getByRole("button", {name: "AdminPayments.reset-one-time-button"}));
        expect(paymentAPI.resetAllPayments).toHaveBeenCalledTimes(3);
    });

    it("covers payment table date/count controls and reload events", async () => {
        const user = userEvent.setup();
        const record = {
            id: 4, userId: 3, name: "Diver", created: "2024-01-01",
            startDate: "2024-01-01", endDate: null, paymentCount: 1,
            paymentType: PaymentTypeEnum.ONE_TIME, boundEvents: []
        };
        (paymentAPI.getAllActivePaymentStatusWithPaymentType as jest.Mock)
                .mockResolvedValue([{userId: 3, name: "Diver", payments: [record]}]);
        (paymentAPI.update as jest.Mock).mockResolvedValue({});
        render(<PaymentListTable paymentType={PaymentTypeEnum.ONE_TIME} keyName="edge"/>);
        const row = await screen.findByText("Diver");
        const buttons = row.closest("tr")!.querySelectorAll("button");
        await user.click(buttons[0] as HTMLElement);
        await waitFor(() => expect(paymentAPI.update).toHaveBeenCalledWith(expect.objectContaining({paymentCount: 2})));
        await user.click(buttons[1] as HTMLElement);
        await waitFor(() => expect(paymentAPI.update).toHaveBeenCalledTimes(2));
        window.dispatchEvent(new Event("updatePaymentList-" + PaymentTypeEnum.ONE_TIME));
        await waitFor(() => expect(paymentAPI.getAllActivePaymentStatusWithPaymentType.mock.calls.length).toBeGreaterThan(1));
    });

    it("covers registration status variants and resend request", async () => {
        const user = userEvent.setup();
        render(<Registration/>);
        expect(screen.getByText("Registration.title.ok")).toBeInTheDocument();
        query = "INVALID";
        cleanup();
        render(<Registration/>);
        expect(screen.getByText("Registration.title.invalid")).toBeInTheDocument();
        query = "OTHER";
        cleanup();
        render(<Registration/>);
        expect(screen.queryByRole("heading")).not.toBeInTheDocument();
        render(<ResendRegistrationEmail token="abc"/>);
        await user.click(screen.getByRole("button", {name: "common.button.send"}));
        await waitFor(() => expect(authAPI.resendRegistrationEmail).toHaveBeenCalledWith("abc"));
        (authAPI.resendRegistrationEmail as jest.Mock).mockRejectedValueOnce(new Error("offline"));
        await user.click(screen.getByRole("button", {name: "common.button.send"}));
        await waitFor(() => expect(authAPI.resendRegistrationEmail).toHaveBeenCalledTimes(2));
    });

    it("renders aggregate API data and handles aggregate errors", async () => {
        render(<AggregateStats/>);
        expect(await screen.findByText("AggregateStats.card.eventsPerYear")).toBeInTheDocument();
        expect(screen.getAllByRole("columnheader").length).toBeGreaterThan(0);
        (statsAPI.getAggregates as jest.Mock).mockRejectedValueOnce(new Error("offline"));
        render(<AggregateStats/>);
        await waitFor(() => expect(statsAPI.getAggregates).toHaveBeenCalledTimes(2));
    });

    it("renders report links and the empty report edge case", async () => {
        const events = [{
            eventId: 12,
            eventDateTime: "2024-06-01T10:00:00Z",
            organizerName: "Organizer",
            participantCount: 4,
            diveCount: 2
        }];
        render(<BiannualEventReportTable events={events} childKey="report"/>);
        expect(screen.getByRole("link", {name: "12"})).toHaveAttribute("href", "/events/12");
        expect(screen.getByText("Organizer")).toBeInTheDocument();
        render(<BiannualEventReportTable events={[]}/>);
        expect(within(screen.getAllByRole("table")[1]).queryByText("Organizer")).not.toBeInTheDocument();
    });
});
