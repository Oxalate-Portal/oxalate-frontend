import {cleanup, fireEvent, render, screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type React from "react";
import {MessageChannel as NodeMessageChannel} from "worker_threads";
import {MemoryRouter, Route, Routes} from "react-router-dom";
import dayjs from "dayjs";
import {ChronoUnitEnum, EmailNotificationTypeEnum, MembershipTypeEnum, UpdateStatusEnum} from "../models";
import {EmailSubscriptionCard} from "../components/User/EmailSubscriptionCard";
import {FormMemberships} from "../components/User/FormMemberships";
import {FormPayments} from "../components/User/FormPayments";
import {LostPassword} from "../components/User/LostPassword";
import {NewPassword} from "../components/User/NewPassword";
import {Password} from "../components/User/Password";
import {ProfileCollapse} from "../components/User/ProfileCollapse";
import {ShowUser} from "../components/User/ShowUser";
import {UserDocumentFiles} from "../components/User/UserDocumentFiles";
import {UserEventList} from "../components/User/UserEventList";
import {UserAvatarManager} from "../components/User/UserAvatarManager";
import {AcceptTerms} from "../components/main/AcceptTerms";
import {HealthStatementConfirmationModal} from "../components/main/HealthStatementConfirmationModal";
import {Login} from "../components/main/Login";
import {ShiftableRangePicker} from "../components/main/ShiftableRangePicker";
import {UserProfile} from "../components/User/UserProfile";
import {adminUserAPI, authAPI, diveEventAPI, emailNotificationSubscriptionAPI, fileTransferAPI, pageAPI, userAPI} from "../services";

jest.setTimeout(30000);

const session = {
    id: 7, username: "person@example.com", firstName: "P", lastName: "Person",
    accessToken: "token", roles: ["ROLE_ADMIN"], avatarUrl: null, approvedTerms: false,
    healthStatementId: null, language: "en", memberships: [], payments: []
} as never;

jest.mock("../session", () => ({
    useSession: () => ({
        userSession: session, sessionLanguage: "en", loginUser: jest.fn(),
        logoutUser: jest.fn(), refreshUserSession: jest.fn(),
        getPortalConfigurationValue: () => "true",
        getFrontendConfigurationValue: (key: string) => key === "enabled-language" ? "en,fi" : "3"
    })
}));
jest.mock("../services", () => ({
    authAPI: {recoverLostPassword: jest.fn(), resetPassword: jest.fn(), updatePassword: jest.fn()},
    adminUserAPI: {findById: jest.fn(), update: jest.fn()},
    diveEventAPI: {findAllDiveEventListItemsByUser: jest.fn()},
    emailNotificationSubscriptionAPI: {getUserEmailSubscriptions: jest.fn(), subscribeToEmailNotification: jest.fn()},
    fileTransferAPI: {findAllDocuments: jest.fn(), uploadDocumentFile: jest.fn()},
    pageAPI: {getNavigationItems: jest.fn()},
    userAPI: {acceptTerms: jest.fn(), acceptHealthStatement: jest.fn(), findById: jest.fn(), updateUserStatus: jest.fn()}
}));
jest.mock("../components/Page", () => ({Page: () => <div>page</div>}));
jest.mock("../components/Certificate", () => ({Certificates: () => <div>certificates</div>}));
jest.mock("../components/main/ProtectedImage", () => ({ProtectedImage: ({alt}: { alt: string }) => <img alt={alt}/>}));

const wrap = (node: React.ReactNode) => <MemoryRouter>{node}</MemoryRouter>;
if (!globalThis.MessageChannel) {
    globalThis.MessageChannel = NodeMessageChannel as never;
}

describe("remaining User and main component paths", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (emailNotificationSubscriptionAPI.getUserEmailSubscriptions as jest.Mock).mockResolvedValue(
                [{emailNotificationType: Object.values(EmailNotificationTypeEnum)[0]}]);
        (emailNotificationSubscriptionAPI.subscribeToEmailNotification as jest.Mock).mockResolvedValue([]);
        (diveEventAPI.findAllDiveEventListItemsByUser as jest.Mock).mockResolvedValue([]);
        (fileTransferAPI.findAllDocuments as jest.Mock).mockResolvedValue([]);
    });

    it("renders tables, empty payment state, events, and shifts all picker units", async () => {
        const memberships = [{
            id: 2,
            type: MembershipTypeEnum.DURATIONAL,
            status: "ACTIVE",
            startDate: new Date("2025-01-01"),
            endDate: new Date("2026-01-01"),
            created: null
        }] as never;
        render(wrap(<><FormMemberships membershipList={memberships}/><FormPayments userData={undefined}/><UserEventList eventType="past" events={[{
            id: 2,
            title: "event",
            startTime: new Date("2025-01-01")
        } as never]}/></>));
        expect(screen.getByText("FormatPayments.noValid")).toBeInTheDocument();
        expect(screen.getByText(/event/)).toBeInTheDocument();
        const onChange = jest.fn();
        for (const periodType of [ChronoUnitEnum.YEARS, ChronoUnitEnum.MONTHS, ChronoUnitEnum.DAYS]) {
            const {unmount} = render(<ShiftableRangePicker periodType={periodType} value={[dayjs("2020-01-01"), dayjs("2020-01-02")]} onChange={onChange}/>);
            const buttons = screen.getAllByRole("button");
            fireEvent.click(buttons[buttons.length - 1]);
            fireEvent.click(buttons[buttons.length - 2]);
            unmount();
        }
        expect(onChange).toHaveBeenCalled();
        render(<ShiftableRangePicker periodType={ChronoUnitEnum.DAYS} value={null} onChange={onChange}/>);
        expect(screen.getAllByRole("button")[0]).toBeEnabled();
    });

    it("loads and updates email subscriptions, including failed requests", async () => {
        const {rerender} = render(<EmailSubscriptionCard userId={7}/>);
        await waitFor(() => expect(screen.getByRole("button", {name: "common.button.save"})).toBeInTheDocument());
        fireEvent.click(screen.getByRole("button", {name: "common.button.save"}));
        await waitFor(() => expect(emailNotificationSubscriptionAPI.subscribeToEmailNotification).toHaveBeenCalled());
        (emailNotificationSubscriptionAPI.getUserEmailSubscriptions as jest.Mock).mockRejectedValueOnce(new Error("offline"));
        rerender(<EmailSubscriptionCard userId={8}/>);
        await waitFor(() => expect(screen.getByText("EmailSubscriptionCard.header")).toBeInTheDocument());
        (emailNotificationSubscriptionAPI.subscribeToEmailNotification as jest.Mock).mockRejectedValueOnce(new Error("offline"));
        expect(emailNotificationSubscriptionAPI.subscribeToEmailNotification).toHaveBeenCalledTimes(1);
    });

    it("covers password and lost-password success and failures", async () => {
        const user = userEvent.setup();
        session.accessToken = "";
        (authAPI.recoverLostPassword as jest.Mock).mockResolvedValue({status: UpdateStatusEnum.OK});
        const {rerender} = render(wrap(<LostPassword/>));
        await user.type(screen.getByRole("textbox"), "person@example.com");
        await user.click(screen.getByRole("button", {name: "LostPassword.form.submitButton"}));
        await waitFor(() => expect(screen.getByText("LostPassword.updateStatus.ok.text")).toBeInTheDocument());
        (authAPI.recoverLostPassword as jest.Mock).mockRejectedValueOnce(new Error("bad"));
        cleanup();
        render(wrap(<LostPassword/>));
        await user.type(screen.getByRole("textbox"), "person@example.com");
        await user.click(screen.getByRole("button", {name: "LostPassword.form.submitButton"}));
        await waitFor(() => expect(screen.getByText("LostPassword.updateStatus.fail.text")).toBeInTheDocument());
        (authAPI.resetPassword as jest.Mock).mockResolvedValue({status: UpdateStatusEnum.OK});
        cleanup();
        render(wrap(<NewPassword/>));
        expect(screen.getByText("NewPassword.title")).toBeInTheDocument();
        (authAPI.updatePassword as jest.Mock).mockResolvedValue({status: UpdateStatusEnum.OK});
        cleanup();
        render(wrap(<Password/>));
        const forms = Array.from(document.querySelectorAll<HTMLInputElement>("input[type=password]"));
        await user.type(forms[0], "old");
        await user.type(forms[1], "StrongPass1!");
        await user.type(forms[2], "StrongPass1!");
        await user.click(screen.getByRole("button", {name: "Password.form.submitButton"}));
        await waitFor(() => expect(screen.getByText("Password.updateStatus.ok.text")).toBeInTheDocument());
    });

    it("covers terms, health modal, avatar and document upload paths", async () => {
        const user = userEvent.setup();
        (userAPI.acceptTerms as jest.Mock).mockResolvedValue({});
        render(wrap(<AcceptTerms registration={false}/>));
        await user.click(screen.getByRole("button", {name: "common.button.confirm"}));
        expect(userAPI.acceptTerms).toHaveBeenCalled();
        cleanup();
        const confirm = jest.fn(), cancel = jest.fn();
        (userAPI.acceptHealthStatement as jest.Mock).mockResolvedValue({});
        render(wrap(<HealthStatementConfirmationModal open onConfirm={confirm} onCancel={cancel}/>));
        await user.click(screen.getByRole("button", {name: "common.button.confirm"}));
        await waitFor(() => expect(confirm).toHaveBeenCalled());
        cleanup();
        render(<UserAvatarManager userId={1} initialAvatarUrl={null}/>);
        expect(screen.getByRole("button", {name: /UserFiles\.avatar\.upload\.button/})).toBeInTheDocument();
        cleanup();
        render(<UserDocumentFiles userId={1} creatorName="P" canUpload/>);
        await waitFor(() => expect(fileTransferAPI.findAllDocuments).toHaveBeenCalled());
        expect(screen.getByRole("button", {name: /UserFiles\.document\.upload\.button/})).toBeInTheDocument();
    });

    it("covers login captcha wrapper, profile collapse, show user and profile API responses", async () => {
        (pageAPI.getNavigationItems as jest.Mock).mockResolvedValue([]);
        (userAPI.findById as jest.Mock).mockResolvedValue({
            id: 7,
            username: "person@example.com",
            firstName: "P",
            lastName: "Person",
            phoneNumber: "",
            registered: new Date(),
            diveCount: 1,
            nextOfKin: "",
            payments: [],
            memberships: [],
            avatarUrl: null
        });
        render(wrap(<Login/>));
        fireEvent.click(screen.getByRole("button", {name: "Login.form.button.forgotPassword"}));
        cleanup();
        render(<ProfileCollapse userId={7} viewOnly/>);
        await waitFor(() => expect(screen.getByText("UserEvents.future-panel.header (0)")).toBeInTheDocument());
        cleanup();
        render(<MemoryRouter initialEntries={["/users/7"]}><Routes><Route path="/users/:paramId" element={<ShowUser/>}/></Routes></MemoryRouter>);
        await waitFor(() => expect(screen.getByText("ShowUser.table.user-details")).toBeInTheDocument());
        cleanup();
        (adminUserAPI.findById as jest.Mock).mockResolvedValue({...session, id: 7, memberships: [], payments: []});
        render(<UserProfile/>);
        await waitFor(() => expect(adminUserAPI.findById).toHaveBeenCalled());
    });
});
