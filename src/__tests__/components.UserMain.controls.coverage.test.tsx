import {cleanup, configure, fireEvent, render, screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type React from "react";
import {MemoryRouter, Route, Routes} from "react-router-dom";
import dayjs from "dayjs";
import {ChronoUnitEnum, MembershipTypeEnum, PaymentTypeEnum, RoleEnum, UpdateStatusEnum} from "../models";
import {adminUserAPI, authAPI, diveEventAPI, fileTransferAPI, pageAPI, userAPI} from "../services";
import {
    AcceptTerms,
    filterDocumentsForCreator,
    FormMemberships,
    FormPayments,
    HealthStatementConfirmationModal,
    Login,
    LoginWithCaptcha,
    LostPassword,
    NavigationBar,
    NewPassword,
    OxalateFooter,
    Password,
    ShiftableRangePicker,
    ShowUser,
    UserAvatarManager,
    UserDocumentFiles,
    UserEventList,
    UserProfile
} from "../components";

jest.setTimeout(120000);

// Slow machines need more headroom than the 1 s default before waitFor/findBy give up
configure({asyncUtilTimeout: 10000});

const session = {
    id: 7, username: "ada@example.com", firstName: "Ada", lastName: "Lovelace",
    accessToken: "", roles: [RoleEnum.ROLE_ADMIN, RoleEnum.ROLE_ORGANIZER], avatarUrl: null,
    approvedTerms: false, healthStatementId: null, language: "en", memberships: [], payments: []
};
const sessionHook = {
    userSession: session as typeof session | null, sessionLanguage: "en", organizationName: "Oxalate",
    logoutUser: jest.fn(), loginUser: jest.fn(), refreshUserSession: jest.fn(), setSessionLanguage: jest.fn(),
    getPortalConfigurationValue: jest.fn((group: string, key: string) => {
        if (group === "MEMBERSHIP" && key === "membership-type") return "DURATIONAL";
        if (key === "commenting-enabled" || key === "blog-enabled") return "true";
        return key === "documents-supported" ? "true" : "true";
    }),
    getFrontendConfigurationValue: jest.fn((key: string) => key === "enabled-language" ? "en,fi" : "4")
};

const mockTranslation = {t: (key: string) => key};
jest.mock("react-i18next", () => ({useTranslation: () => mockTranslation}));
jest.mock("../session", () => ({useSession: () => sessionHook}));
jest.mock("../services", () => ({
    getApiBaseUrl: () => "http://api",
    authAPI: {recoverLostPassword: jest.fn(), resetPassword: jest.fn(), updatePassword: jest.fn()},
    adminUserAPI: {findById: jest.fn(), update: jest.fn()},
    diveEventAPI: {findAllDiveEventListItemsByUser: jest.fn()},
    fileTransferAPI: {findAllDocuments: jest.fn(), uploadDocumentFile: jest.fn()},
    pageAPI: {getNavigationItems: jest.fn()},
    userAPI: {acceptTerms: jest.fn(), acceptHealthStatement: jest.fn(), findById: jest.fn(), updateUserStatus: jest.fn()}
}));
jest.mock("../components/Page", () => ({Page: () => <div>page content</div>}));
jest.mock("../components/Certificate", () => ({Certificates: () => <div>certificates</div>}));
jest.mock("../components/User/UserFields", () => ({
    UserFields: () => <div>fields</div>
}));
jest.mock("../components/Notification", () => ({
    ...jest.requireActual("../components/Notification"),
    NotificationDropdown: () => <button>notifications</button>
}));
jest.mock("../components/Blogging", () => ({
    ...jest.requireActual("../components/Blogging"),
    useBlogMenuItems: () => []
}));

const wrap = (element: React.ReactNode) => <MemoryRouter>{element}</MemoryRouter>;
if (!globalThis.MessageChannel) {
    class TestMessageChannel {
        port1 = {onmessage: null, close: jest.fn()};
        port2 = {postMessage: jest.fn(), close: jest.fn()};
    }

    globalThis.MessageChannel = TestMessageChannel as never;
}
const userData = {
    id: 7, username: "ada@example.com", firstName: "Ada", lastName: "Lovelace", phoneNumber: "123",
    registered: new Date("2020-01-01"), diveCount: 2, nextOfKin: "Kin", status: "ACTIVE",
    roles: [RoleEnum.ROLE_ADMIN], language: "en", privacy: false, primaryUserType: "USER",
    approvedTerms: false, healthStatementId: null, avatarUrl: null,
    memberships: [{
        id: 1,
        type: MembershipTypeEnum.DURATIONAL,
        status: "ACTIVE",
        startDate: new Date("2024-01-01"),
        endDate: new Date("2025-01-01"),
        created: null
    }],
    payments: [{
        id: 2,
        paymentType: PaymentTypeEnum.ONE_TIME,
        paymentCount: 1,
        startDate: new Date("2024-01-01"),
        endDate: null,
        created: new Date("2024-01-01")
    }]
};

beforeEach(() => {
    jest.clearAllMocks();
    sessionHook.userSession = session;
    (diveEventAPI.findAllDiveEventListItemsByUser as jest.Mock).mockResolvedValue([]);
    (fileTransferAPI.findAllDocuments as jest.Mock).mockResolvedValue([]);
    (pageAPI.getNavigationItems as jest.Mock).mockResolvedValue([]);
    (userAPI.updateUserStatus as jest.Mock).mockResolvedValue({});
});
afterEach(cleanup);

describe("User and main controls and API outcomes", () => {
    it("renders table branches and event links", () => {
        render(wrap(<><FormMemberships membershipList={[
            {...userData.memberships[0], type: MembershipTypeEnum.PERPETUAL},
            {...userData.memberships[0], id: 3, type: MembershipTypeEnum.PERIODICAL, created: new Date("2024-01-01")}
        ] as never}/><FormPayments userData={userData as never}/><UserEventList eventType="past" events={[]}/></>));
        expect(screen.getByRole("columnheader", {name: "FormMemberships.table.end-date"})).toBeInTheDocument();
        expect(screen.getByRole("columnheader", {name: "FormatPayments.table.created"})).toBeInTheDocument();
        expect(screen.queryByText("2024-01-01:")).not.toBeInTheDocument();
        expect(filterDocumentsForCreator([{id: 1, creator: "Ada"} as never, {id: 2, creator: "Bob"} as never], "Ada")).toHaveLength(1);
    });

    it("uses password and recovery controls through validation, success, failure, and redirects", async () => {
        const u = userEvent.setup({delay: null});
        render(wrap(<LostPassword/>));
        await u.click(screen.getByRole("button", {name: "LostPassword.form.submitButton"}));
        expect(authAPI.recoverLostPassword).not.toHaveBeenCalled();
        (authAPI.recoverLostPassword as jest.Mock).mockResolvedValueOnce({status: UpdateStatusEnum.OK});
        fireEvent.change(screen.getByRole("textbox"), {target: {value: "ada@example.com"}});
        await u.click(screen.getByRole("button", {name: "LostPassword.form.submitButton"}));
        await waitFor(() => expect(screen.getByText("LostPassword.updateStatus.ok.text")).toBeInTheDocument());
        await u.click(screen.getByRole("button", {name: "LostPassword.updateStatus.ok.button"}));
        cleanup();
        render(wrap(<LostPassword/>));
        (authAPI.recoverLostPassword as jest.Mock).mockResolvedValueOnce({status: UpdateStatusEnum.FAIL});
        fireEvent.change(screen.getByRole("textbox"), {target: {value: "ada@example.com"}});
        await u.click(screen.getByRole("button", {name: "LostPassword.form.submitButton"}));
        await waitFor(() => expect(screen.getByText("LostPassword.updateStatus.fail.text")).toBeInTheDocument());
        cleanup();
        render(wrap(<Password/>));
        const passwords = Array.from(document.querySelectorAll<HTMLInputElement>("input[type=password]"));
        fireEvent.change(passwords[0], {target: {value: "old"}});
        fireEvent.change(passwords[1], {target: {value: "NewPassword1!"}});
        fireEvent.change(passwords[2], {target: {value: "NewPassword1!"}});
        (authAPI.updatePassword as jest.Mock).mockResolvedValueOnce({status: UpdateStatusEnum.OK});
        await u.click(screen.getByRole("button", {name: "Password.form.submitButton"}));
        await waitFor(() => expect(screen.getByText("Password.updateStatus.ok.text")).toBeInTheDocument());
        await u.click(screen.getByRole("button", {name: "Password.updateStatus.ok.button"}));
    });

    it("covers reset-token, terms, health and upload controls", async () => {
        const u = userEvent.setup({delay: null});
        render(<MemoryRouter initialEntries={["/reset/abc"]}><Routes><Route path="/reset/:token" element={<NewPassword/>}/></Routes></MemoryRouter>);
        (authAPI.resetPassword as jest.Mock).mockResolvedValueOnce({status: UpdateStatusEnum.OK});
        const fields = Array.from(document.querySelectorAll<HTMLInputElement>("input[type=password]"));
        fireEvent.change(fields[0], {target: {value: "NewPassword1!"}});
        fireEvent.change(fields[1], {target: {value: "NewPassword1!"}});
        fireEvent.submit(document.querySelector("form")!);
        await waitFor(() => expect(authAPI.resetPassword).toHaveBeenCalled());
        cleanup();
        (userAPI.acceptTerms as jest.Mock).mockResolvedValue({});
        render(wrap(<AcceptTerms registration={false}/>));
        await u.click(screen.getByRole("button", {name: "common.button.confirm"}));
        await waitFor(() => expect(userAPI.acceptTerms).toHaveBeenCalled());
        cleanup();
        (userAPI.acceptHealthStatement as jest.Mock).mockResolvedValue({});
        const confirm = jest.fn();
        render(wrap(<HealthStatementConfirmationModal open onConfirm={confirm} onCancel={jest.fn()}/>));
        await u.click(screen.getByRole("button", {name: "common.button.confirm"}));
        await waitFor(() => expect(confirm).toHaveBeenCalled());
        cleanup();
        render(<UserDocumentFiles userId={7} creatorName="Ada" canUpload/>);
        await waitFor(() => expect(fileTransferAPI.findAllDocuments).toHaveBeenCalled());
        const file = new File(["pdf"], "proof.pdf", {type: "application/pdf"});
        fireEvent.change(document.querySelector("input[type=file]")!, {target: {files: [file]}});
        render(<UserAvatarManager userId={7} initialAvatarUrl="/avatar.png"/>);
        expect(screen.getAllByRole("img").length).toBeGreaterThan(0);
    });

    it("exercises rejected reset/password, terms, health and document requests", async () => {
        const u = userEvent.setup({delay: null});
        render(wrap(<NewPassword/>));
        const noTokenFields = Array.from(document.querySelectorAll<HTMLInputElement>("input[type=password]"));
        fireEvent.change(noTokenFields[0], {target: {value: "NewPassword1!"}});
        fireEvent.change(noTokenFields[1], {target: {value: "NewPassword1!"}});
        fireEvent.submit(document.querySelector("form")!);
        await waitFor(() => expect(screen.getByText("NewPassword.updateStatus.fail.text")).toBeInTheDocument());
        cleanup();
        (authAPI.resetPassword as jest.Mock).mockResolvedValueOnce({status: UpdateStatusEnum.FAIL});
        render(<MemoryRouter initialEntries={["/reset/abc"]}><Routes><Route path="/reset/:token" element={<NewPassword/>}/></Routes></MemoryRouter>);
        const resetFields = Array.from(document.querySelectorAll<HTMLInputElement>("input[type=password]"));
        fireEvent.change(resetFields[0], {target: {value: "NewPassword1!"}});
        fireEvent.change(resetFields[1], {target: {value: "NewPassword1!"}});
        fireEvent.submit(document.querySelector("form")!);
        await waitFor(() => expect(screen.getByText("NewPassword.updateStatus.fail.text")).toBeInTheDocument());
        cleanup();
        (authAPI.updatePassword as jest.Mock).mockResolvedValueOnce({status: UpdateStatusEnum.FAIL});
        render(wrap(<Password/>));
        const passwordFields = Array.from(document.querySelectorAll<HTMLInputElement>("input[type=password]"));
        for (const [index, value] of ["old", "NewPassword1!", "NewPassword1!"].entries()) {
            fireEvent.change(passwordFields[index], {target: {value}});
        }
        fireEvent.submit(document.querySelector("form")!);
        await waitFor(() => expect(screen.getByText("Password.updateStatus.fail.text")).toBeInTheDocument());
        cleanup();
        (userAPI.acceptTerms as jest.Mock).mockRejectedValueOnce(new Error("offline"));
        render(wrap(<AcceptTerms registration={false}/>));
        await u.click(screen.getByRole("button", {name: "common.button.confirm"}));
        await waitFor(() => expect(screen.getByText("AcceptTerms.error.alert")).toBeInTheDocument());
        cleanup();
        (userAPI.acceptHealthStatement as jest.Mock).mockRejectedValueOnce(new Error("offline"));
        render(wrap(<HealthStatementConfirmationModal open onConfirm={jest.fn()} onCancel={jest.fn()}/>));
        await u.click(screen.getByRole("button", {name: "common.button.confirm"}));
        await waitFor(() => expect(screen.getByText("HealthStatementConfirmationModal.error")).toBeInTheDocument());
        cleanup();
        (fileTransferAPI.findAllDocuments as jest.Mock).mockRejectedValueOnce(new Error("offline"));
        render(<UserDocumentFiles userId={7} creatorName="Ada" canUpload={false}/>);
        await waitFor(() => expect(screen.getByText("UserFiles.document.title")).toBeInTheDocument());
    });

    it("covers profile/show user, update paths, role controls, and range shifts", async () => {
        (userAPI.findById as jest.Mock).mockResolvedValue(userData);
        render(<MemoryRouter initialEntries={["/users/7"]}><Routes><Route path="/users/:paramId" element={<ShowUser/>}/></Routes></MemoryRouter>);
        await waitFor(() => expect(screen.getByText("Lovelace, Ada")).toBeInTheDocument());
        cleanup();
        (adminUserAPI.findById as jest.Mock).mockResolvedValue(userData);
        (adminUserAPI.update as jest.Mock).mockResolvedValue(userData);
        render(<UserProfile/>);
        await waitFor(() => expect(screen.getByRole("button", {name: "common.button.update"})).toBeInTheDocument());
        window.confirm = jest.fn().mockReturnValue(true);
        fireEvent.click(screen.getByRole("button", {name: "User.button.lockAccount"}));
        await waitFor(() => expect(userAPI.updateUserStatus).toHaveBeenCalled());
        (adminUserAPI.update as jest.Mock).mockResolvedValueOnce(userData);
        fireEvent.click(screen.getByRole("button", {name: "common.button.update"}));
        await waitFor(() => expect(adminUserAPI.update).toHaveBeenCalled());
        cleanup();
        const onChange = jest.fn();
        render(<ShiftableRangePicker periodType={ChronoUnitEnum.MONTHS} value={[dayjs("2020-01-01"), dayjs("2020-02-01")]} onChange={onChange}/>);
        const buttons = screen.getAllByRole("button");
        fireEvent.click(buttons[0]);
        fireEvent.click(buttons[buttons.length - 1]);
        expect(onChange).toHaveBeenCalled();
    });

    it("covers profile acceptance actions and update failure paths", async () => {
        (adminUserAPI.findById as jest.Mock).mockResolvedValue(userData);
        (userAPI.acceptTerms as jest.Mock).mockResolvedValue({});
        (userAPI.acceptHealthStatement as jest.Mock).mockResolvedValue({});
        (adminUserAPI.update as jest.Mock).mockRejectedValue(new Error("update failed"));
        render(<UserProfile/>);
        await waitFor(() => expect(screen.getByRole("button", {name: "User.button.acceptTerms"})).toBeInTheDocument());

        fireEvent.click(screen.getByRole("button", {name: "User.button.acceptTerms"}));
        await waitFor(() => expect(screen.getByRole("button", {name: "common.button.confirm"})).toBeInTheDocument());
        fireEvent.click(screen.getByRole("button", {name: "common.button.confirm"}));
        await waitFor(() => expect(userAPI.acceptTerms).toHaveBeenCalledWith({confirmationAnswer: true}));

        fireEvent.click(screen.getByRole("button", {name: "User.button.confirmHealthStatement"}));
        await waitFor(() => expect(screen.getByRole("button", {name: "common.button.confirm"})).toBeInTheDocument());
        fireEvent.click(screen.getByRole("button", {name: "common.button.confirm"}));
        expect(sessionHook.refreshUserSession).toHaveBeenCalled();

        fireEvent.click(screen.getByRole("button", {name: "common.button.update"}));
        await waitFor(() => expect(adminUserAPI.update).toHaveBeenCalled());
    });

    it("handles profile status failures, confirmation rejection, and avatar synchronization", async () => {
        const error = jest.spyOn(console, "error").mockImplementation(() => undefined);
        (adminUserAPI.findById as jest.Mock).mockResolvedValue({...userData, avatarUrl: "/server-avatar.png"});
        (userAPI.updateUserStatus as jest.Mock).mockRejectedValue(new Error("status failed"));
        (userAPI.acceptTerms as jest.Mock).mockRejectedValue(new Error("terms failed"));
        window.confirm = jest.fn().mockReturnValue(true);
        render(<UserProfile/>);
        await waitFor(() => expect(screen.getByRole("button", {name: "User.button.lockAccount"})).toBeInTheDocument());
        expect(sessionHook.refreshUserSession).toHaveBeenCalledWith(expect.objectContaining({avatarUrl: "/server-avatar.png"}));

        fireEvent.click(screen.getByRole("button", {name: "User.button.lockAccount"}));
        fireEvent.click(screen.getByRole("button", {name: "User.button.anonymizeAccount"}));
        await waitFor(() => expect(userAPI.updateUserStatus).toHaveBeenCalledTimes(2));
        expect(sessionHook.logoutUser).toHaveBeenCalled();
        expect(error).toHaveBeenCalled();

        fireEvent.click(screen.getByRole("button", {name: "User.button.acceptTerms"}));
        await waitFor(() => expect(screen.getAllByRole("button", {name: "common.button.reject"}).length).toBeGreaterThan(0));
        fireEvent.click(screen.getAllByRole("button", {name: "common.button.reject"})[0]);
        fireEvent.click(screen.getByRole("button", {name: "User.button.acceptTerms"}));
        await waitFor(() => expect(screen.getAllByRole("button", {name: "common.button.confirm"}).length).toBeGreaterThan(0));
        fireEvent.click(screen.getAllByRole("button", {name: "common.button.confirm"})[0]);
        await waitFor(() => expect(error).toHaveBeenCalledWith(new Error("terms failed")));

        fireEvent.click(screen.getByRole("button", {name: "User.button.confirmHealthStatement"}));
        await waitFor(() => expect(screen.getAllByRole("button", {name: "common.button.reject"}).length).toBeGreaterThan(0));
        fireEvent.click(screen.getAllByRole("button", {name: "common.button.reject"}).at(-1)!);
    });

    it("reports a missing session while loading the profile", async () => {
        const error = jest.spyOn(console, "error").mockImplementation(() => undefined);
        sessionHook.userSession = null;
        render(<UserProfile/>);
        await waitFor(() => expect(error).toHaveBeenCalledWith("No userSession found"));
        sessionHook.userSession = session;
    });

    it("covers login states, navigation languages/mobile drawer, captcha wrapper and footer", async () => {
        const executeRecaptcha = jest.fn().mockResolvedValue("captcha");
        jest.doMock("@wojtekmaj/react-recaptcha-v3", () => ({
            useReCaptcha: () => ({executeRecaptcha}),
            GoogleReCaptchaProvider: ({children}: { children: React.ReactNode }) => <>{children}</>
        }));
        sessionHook.loginUser.mockResolvedValue({status: "FAILURE"});
        render(wrap(<Login/>));
        fireEvent.change(screen.getByLabelText("Login.form.username.label"), {target: {value: "ada@example.com"}});
        fireEvent.change(screen.getByLabelText("Login.form.password.label"), {target: {value: "wrong"}});
        fireEvent.click(screen.getByRole("button", {name: "common.button.login"}));
        expect(await screen.findByText("Login.updateStatus.loginFail")).toBeInTheDocument();
        render(wrap(<LoginWithCaptcha/>));
        render(wrap(<NavigationBar/>));
        await waitFor(() => expect(screen.getByRole("button", {name: "NavigationBar.openMenu"})).toBeInTheDocument());
        fireEvent.click(screen.getByRole("button", {name: "NavigationBar.openMenu"}));
        expect(await screen.findByText("Ada Lovelace")).toBeInTheDocument();
        render(<OxalateFooter/>);
    });
});
