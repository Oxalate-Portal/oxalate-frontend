import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import type {ReactNode} from "react";
import axios from "axios";
import {authAPI, pageAPI, paymentAPI, statsAPI} from "../services";
import {HealthStatementConfirmation} from "../components/main/HealthStatementConfirmation";
import {Home} from "../components/main/Home";
import {ProtectedImage} from "../components/main/ProtectedImage";
import {PastDiveEvents} from "../components/DiveEvent/PastDiveEvents";
import {Registration} from "../components/Register/Registration";
import {ResendRegistrationEmail} from "../components/Register/ResendRegistrationEmail";
import {PasswordFields} from "../components/User/PasswordFields";
import {PasswordRules} from "../components/User/PasswordRules";
import {Page} from "../components/Page/Page";
import {Payments} from "../components/Payment/Payments";
import {AggregateStats} from "../components/Statistics/AggregateStats";

const stableTranslation = {t: (key: string) => key};
jest.mock("react-i18next", () => ({useTranslation: () => stableTranslation}));
jest.mock("react-router-dom", () => ({
    useParams: () => ({paramId: "7"}),
    useSearchParams: () => [new URLSearchParams("status=OK")],
    Link: ({children, to}: { children: ReactNode; to: string }) => <a href={to}>{children}</a>
}));
jest.mock("../session", () => ({
    useSession: () => ({
        sessionLanguage: "en",
        userSession: {id: 1},
        getPortalConfigurationValue: () => "true"
    })
}));
jest.mock("../components/Page", () => ({Page: ({pageId}: { pageId: number }) => <div>page-{pageId}</div>}));
jest.mock("../components/DiveEvent/DiveEventsTable", () => ({
    DiveEventsTable: ({diveEventType, title}: { diveEventType: string; title: string }) =>
            <div>{diveEventType}-{title}</div>
}));
jest.mock("../components/Payment/ListPayments", () => ({ListPayments: () => <div>payment-list</div>}));
jest.mock("../components/Payment/AddPayments", () => ({AddPayments: () => <div>add-payments</div>}));
jest.mock("@ant-design/charts", () => ({Column: () => <div>column-chart</div>, Line: () => <div>line-chart</div>}));
jest.mock("@ant-design/icons", () => ({CloseCircleOutlined: ({onClick}: { onClick?: () => void }) => <button onClick={onClick}>remove</button>}));
jest.mock("antd", () => ({
    Alert: ({title}: { title: string }) => <div role="alert">{title}</div>,
    Button: ({children, onClick}: { children: ReactNode; onClick?: () => void }) => <button onClick={onClick}>{children}</button>,
    Divider: ({children}: { children: ReactNode }) => <h3>{children}</h3>,
    Form: {Item: ({children, label}: { children: ReactNode; label: string }) => <label>{label}{children}</label>},
    Input: {Password: () => <input type="password"/>},
    Image: (props: Record<string, unknown>) => <img {...props}/>,
    Layout: {Footer: ({children}: { children: ReactNode }) => <footer>{children}</footer>},
    Spin: ({children}: { children: ReactNode }) => <div>{children}</div>,
    Space: ({children}: { children: ReactNode }) => <div>{children}</div>,
    Row: ({children}: { children: ReactNode }) => <div>{children}</div>,
    Col: ({children}: { children: ReactNode }) => <div>{children}</div>,
    Card: ({children, title}: { children: ReactNode; title: string }) => <section><h2>{title}</h2>{children}</section>,
    Table: ({dataSource}: { dataSource?: Array<Record<string, unknown>> }) => <div>table-{dataSource?.length ?? 0}</div>
}));

const mockedAuth = jest.mocked(authAPI);
const mockedPage = jest.mocked(pageAPI);
const mockedPayment = jest.mocked(paymentAPI);
const mockedStats = jest.mocked(statsAPI);

beforeEach(() => {
    jest.clearAllMocks();
    mockedPage.findById = jest.fn().mockResolvedValue({
        createdAt: "2024-01-01", modifiedAt: null,
        pageVersions: [{title: "<b>Hello</b>", ingress: "intro", body: "<p>body</p>"}]
    }) as typeof mockedPage.findById;
});

test("renders simple main, dive, registration and password components", () => {
    render(<><HealthStatementConfirmation/><Home/><PastDiveEvents/><Registration/><PasswordRules/><PasswordFields/></>);
    expect(screen.getByText("page-3")).toBeInTheDocument();
    expect(screen.getByText("page-1")).toBeInTheDocument();
    expect(screen.getByText("past-PastEvents.title")).toBeInTheDocument();
    expect(screen.getByText("Registration.title.ok")).toBeInTheDocument();
    expect(screen.getByText("PasswordRules.rule.4")).toBeInTheDocument();
    expect(screen.getByLabelText("PasswordFields.form.newPassword.label")).toBeInTheDocument();
});

test("resends registration email on API success and tolerates failure", async () => {
    mockedAuth.resendRegistrationEmail = jest.fn().mockResolvedValue(true) as typeof mockedAuth.resendRegistrationEmail;
    render(<ResendRegistrationEmail token="token-1"/>);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(mockedAuth.resendRegistrationEmail).toHaveBeenCalledWith("token-1"));
    mockedAuth.resendRegistrationEmail = jest.fn().mockRejectedValue(new Error("offline")) as typeof mockedAuth.resendRegistrationEmail;
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(mockedAuth.resendRegistrationEmail).toHaveBeenCalledTimes(1));
});

test("loads a page and displays sanitized content, including updated dates", async () => {
    render(<Page pageId={7}/>);
    await waitFor(() => expect(screen.getByText("Hello")).toBeInTheDocument());
    expect(screen.getByText(/Page.fields.created/)).toBeInTheDocument();
    expect(screen.getByText("intro")).toBeInTheDocument();
    expect(screen.getByText("body")).toBeInTheDocument();
    expect(mockedPage.findById).toHaveBeenCalledWith(7, "language=en");
});

test("handles protected image success and remove interaction", async () => {
    const createUrl = jest.fn().mockReturnValue("blob:test");
    Object.defineProperty(URL, "createObjectURL", {value: createUrl, configurable: true});
    jest.spyOn(axios, "get").mockResolvedValue({data: new Blob(["image"])});
    const remove = jest.fn();
    render(<ProtectedImage imageUrl="/image" onRemove={remove} alt="avatar"/>);
    await waitFor(() => expect(screen.getByAltText("avatar")).toHaveAttribute("src", "blob:test"));
    fireEvent.click(screen.getByRole("button", {name: "remove"}));
    expect(remove).toHaveBeenCalled();
    delete (URL as unknown as { createObjectURL?: unknown }).createObjectURL;
});

test("renders payment controls and resets enabled payment types", async () => {
    mockedPayment.resetAllPayments = jest.fn().mockResolvedValue(true) as typeof mockedPayment.resetAllPayments;
    window.confirm = jest.fn().mockReturnValue(true);
    render(<Payments/>);
    expect(screen.getByText("payment-list")).toBeInTheDocument();
    fireEvent.click(screen.getByText("AdminPayments.reset-periodical-button"));
    await waitFor(() => expect(mockedPayment.resetAllPayments).toHaveBeenCalled());
    expect(screen.getByText("AdminPayments.reset-one-time-button")).toBeInTheDocument();
});

test("renders aggregate statistics after API success and failure", async () => {
    const stats = {eventsPerYear: [{year: 2024, value: 2}], diversPerYear: [], eventTypesPerYear: [], diverTypesPerYear: []};
    mockedStats.getAggregates = jest.fn().mockResolvedValue(stats) as typeof mockedStats.getAggregates;
    render(<AggregateStats/>);
    await waitFor(() => expect(screen.getByText("AggregateStats.card.eventsPerYear")).toBeInTheDocument());
    expect(screen.getAllByText("table-1")).toHaveLength(1);
    mockedStats.getAggregates = jest.fn().mockRejectedValue(new Error("failed")) as typeof mockedStats.getAggregates;
    render(<AggregateStats/>);
    await waitFor(() => expect(mockedStats.getAggregates).toHaveBeenCalled());
});
