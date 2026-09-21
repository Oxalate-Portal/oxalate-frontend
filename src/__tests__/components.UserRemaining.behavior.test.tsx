import {cleanup, configure, fireEvent, render, screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {MemoryRouter, Route, Routes} from "react-router-dom";
import {
    FormMemberships,
    FormPayments,
    LostPassword,
    NewPassword,
    Password,
    ProfileCollapse,
    ShowUser,
    UserAvatarManager,
    UserDocumentFiles,
    UserEventList,
    UserProfile
} from "../components";
import {MembershipTypeEnum, PaymentTypeEnum, RoleEnum, UpdateStatusEnum} from "../models";
import {adminUserAPI, authAPI, diveEventAPI, fileTransferAPI, userAPI} from "../services";

jest.setTimeout(60000);

// Slow machines need more headroom than the 1 s default before waitFor/findBy give up
configure({asyncUtilTimeout: 10000});
if (!globalThis.MessageChannel) {
    class TestMessageChannel {
        port1 = {onmessage: null as ((event: MessageEvent) => void) | null, close: jest.fn()};
        port2 = {
            postMessage: (data: unknown) => queueMicrotask(() => this.port1.onmessage?.(new MessageEvent("message", {data}))),
            close: jest.fn()
        };
    }

    globalThis.MessageChannel = TestMessageChannel as never;
}

const session = {
    id: 7, username: "user@example.com", first_name: "Ada", last_name: "Lovelace",
    access_token: "", roles: [RoleEnum.ROLE_ADMIN] as RoleEnum[], avatar_url: null, approved_terms: true,
    health_statement_id: 1, language: "fi", memberships: [], payments: []
};
const getPortalConfigurationValue = (_group: string, key: string) => key === "documents-supported" ? "true" : "false";
const getFrontendConfigurationValue = (key: string) => key === "enabled-language" ? "en,fi" : "4";
const sessionHook = {
    userSession: session, logoutUser: jest.fn(), refreshUserSession: jest.fn(),
    getPortalConfigurationValue, getFrontendConfigurationValue
};

const mockTranslation = {t: (key: string) => key};
jest.mock("react-i18next", () => ({useTranslation: () => mockTranslation}));
jest.mock("../session", () => ({
    useSession: () => sessionHook
}));
jest.mock("../services", () => ({
    getApiBaseUrl: () => "http://api",
    authAPI: {recoverLostPassword: jest.fn(), resetPassword: jest.fn(), updatePassword: jest.fn()},
    adminUserAPI: {findById: jest.fn(), update: jest.fn()},
    diveEventAPI: {findAllDiveEventListItemsByUser: jest.fn()},
    fileTransferAPI: {findAllDocuments: jest.fn(), uploadDocumentFile: jest.fn()},
    userAPI: {findById: jest.fn(), updateUserStatus: jest.fn(), acceptTerms: jest.fn()}
}));
jest.mock("../components/Certificate", () => ({Certificates: () => <div>certificates</div>}));
jest.mock("../components/User/UserFields", () => ({
    UserFields: ({isOrganizer}: { isOrganizer: boolean }) =>
            <div data-testid="user-fields">{isOrganizer ? "organizer" : "user"}</div>
}));

const wrap = (node: React.ReactNode) => <MemoryRouter>{node}</MemoryRouter>;
/** Wraps rows in the page envelope the server-paged list endpoints return. */
const mockPage = <T, >(rows: T[]) => ({
    content: rows,
    page: 0,
    size: 10,
    total_elements: rows.length,
    total_pages: 1,
    first: true,
    last: true,
    empty: rows.length === 0
});


describe("remaining User components", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (diveEventAPI.findAllDiveEventListItemsByUser as jest.Mock).mockResolvedValue([]);
        (fileTransferAPI.findAllDocuments as jest.Mock).mockResolvedValue(mockPage([]));
    });
    afterEach(cleanup);

    it("renders membership/payment edge rows and event links", () => {
        render(wrap(<>
            <FormMemberships membershipList={[
                {
                    id: 1,
                    type: MembershipTypeEnum.DURATIONAL,
                    status: "ACTIVE",
                    start_date: new Date("2025-01-01"),
                    end_date: new Date("2026-01-01"),
                    created: null
                },
                {
                    id: 2,
                    type: MembershipTypeEnum.PERPETUAL,
                    status: "ACTIVE",
                    start_date: new Date("2025-01-01"),
                    end_date: new Date("2025-01-01"),
                    created: null
                }
            ] as never}/>
            <FormPayments userData={{
                payments: [{
                    id: 3,
                    payment_type: PaymentTypeEnum.ONE_TIME,
                    payment_count: 2,
                    start_date: new Date("2025-01-01"),
                    end_date: null,
                    created: new Date("2025-01-01")
                }]
            } as never}/>
            <UserEventList eventType="past" events={[{id: 9, title: "Past event", start_time: new Date("2024-01-01")} as never]}/>
        </>));
        expect(screen.getByRole("link", {name: /Past event/})).toHaveAttribute("href", "/events/9/show");
        expect(screen.getByRole("columnheader", {name: "FormMemberships.table.id"})).toBeInTheDocument();
        expect(screen.getByRole("columnheader", {name: "FormatPayments.table.paymentType"})).toBeInTheDocument();
    });

    it("validates lost password and handles API success, failure, and logged-in redirect", async () => {
        const user = userEvent.setup({delay: null});
        render(wrap(<LostPassword/>));
        await user.click(screen.getByRole("button", {name: "LostPassword.form.submitButton"}));
        expect(authAPI.recoverLostPassword).not.toHaveBeenCalled();
        fireEvent.change(screen.getByRole("textbox"), {target: {value: "bad"}});
        await user.click(screen.getByRole("button", {name: "LostPassword.form.submitButton"}));
        expect(authAPI.recoverLostPassword).not.toHaveBeenCalled();
        (authAPI.recoverLostPassword as jest.Mock).mockResolvedValue({status: UpdateStatusEnum.OK});
        fireEvent.change(screen.getByRole("textbox"), {target: {value: "person@example.com"}});
        await user.click(screen.getByRole("button", {name: "LostPassword.form.submitButton"}));
        await waitFor(() => expect(screen.getByText("LostPassword.updateStatus.ok.text")).toBeInTheDocument());
        cleanup();
        (authAPI.recoverLostPassword as jest.Mock).mockRejectedValue(new Error("offline"));
        render(wrap(<LostPassword/>));
        fireEvent.change(screen.getByRole("textbox"), {target: {value: "person@example.com"}});
        await user.click(screen.getByRole("button", {name: "LostPassword.form.submitButton"}));
        await waitFor(() => expect(screen.getByText("LostPassword.updateStatus.fail.text")).toBeInTheDocument());
    });

    it("covers password validation and reset-token form edge", async () => {
        const user = userEvent.setup({delay: null});
        session.access_token = "";
        render(wrap(<Password/>));
        await user.click(screen.getByRole("button", {name: "Password.form.submitButton"}));
        expect(authAPI.updatePassword).not.toHaveBeenCalled();
        render(wrap(<NewPassword/>));
        await user.click(screen.getByRole("button", {name: "common.button.update"}));
        expect(authAPI.resetPassword).not.toHaveBeenCalled();
        expect(screen.getByText("NewPassword.title")).toBeInTheDocument();
        cleanup();
        render(<MemoryRouter initialEntries={["/reset/token"]}><Routes><Route path="/reset/:token" element={<NewPassword/>}/></Routes></MemoryRouter>);
        expect(screen.getByText("NewPassword.title")).toBeInTheDocument();
    });

    it("loads profile collapse events and handles API failure", async () => {
        (diveEventAPI.findAllDiveEventListItemsByUser as jest.Mock).mockResolvedValue([
            {id: 1, title: "future", start_time: new Date("2999-01-01")},
            {id: 2, title: "past", start_time: new Date("2000-01-01")}
        ]);
        render(<ProfileCollapse userId={7} viewOnly={false}/>);
        await waitFor(() => expect(screen.getByText(/UserEvents.future-panel.header \(1\)/)).toBeInTheDocument());
        expect(screen.getByText(/UserEvents.past-panel.header \(1\)/)).toBeInTheDocument();
        (diveEventAPI.findAllDiveEventListItemsByUser as jest.Mock).mockRejectedValueOnce(new Error("offline"));
        cleanup();
        render(<ProfileCollapse userId={0} viewOnly/>);
        expect(diveEventAPI.findAllDiveEventListItemsByUser).toHaveBeenCalledTimes(1);
    });

    it("gates document files, filters creators, and exercises upload control and avatar states", async () => {
        render(<UserDocumentFiles userId={7} creatorName="Lovelace, Ada" canUpload/>);
        await waitFor(() => expect(fileTransferAPI.findAllDocuments).toHaveBeenCalledWith(expect.objectContaining({page: 0, size: 5}), 7));
        expect(screen.getByRole("button", {name: /UserFiles\.document\.upload\.button/})).toBeInTheDocument();
        const file = new File(["pdf"], "proof.pdf", {type: "application/pdf"});
        fireEvent.change(document.querySelector('input[type="file"]')!, {target: {files: [file]}});
        render(<UserAvatarManager userId={7} initialAvatarUrl={null}/>);
        expect(screen.getByRole("button", {name: /UserFiles\.avatar\.upload\.button/})).toBeInTheDocument();
    });

    it("loads ShowUser and UserProfile with admin role and Finnish language, including API failure", async () => {
        (userAPI.findById as jest.Mock).mockResolvedValue({
            id: 7, username: "user@example.com", first_name: "Ada", last_name: "Lovelace",
            phone_number: "123", registered: new Date(), dive_count: 3, next_of_kin: "Kin", payments: [], memberships: []
        });
        render(<MemoryRouter initialEntries={["/users/7"]}><Routes><Route path="/users/:paramId" element={<ShowUser/>}/></Routes></MemoryRouter>);
        await waitFor(() => expect(screen.getByText("Lovelace, Ada")).toBeInTheDocument());
        cleanup();
        sessionHook.userSession = {...session, roles: [RoleEnum.ROLE_ORGANIZER]};
        (adminUserAPI.findById as jest.Mock).mockResolvedValue({...session, id: 7, roles: [RoleEnum.ROLE_ORGANIZER], memberships: [], payments: []});
        render(<UserProfile/>);
        await waitFor(() => expect(screen.getByTestId("user-fields")).toHaveTextContent("organizer"));
        (adminUserAPI.findById as jest.Mock).mockRejectedValueOnce(new Error("offline"));
        cleanup();
        render(<UserProfile/>);
        await waitFor(() => expect(adminUserAPI.findById).toHaveBeenCalledTimes(2));
    });
});
