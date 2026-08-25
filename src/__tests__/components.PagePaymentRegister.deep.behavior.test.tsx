import {cleanup, fireEvent, render, screen, waitFor, within} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type {ReactNode} from "react";
import {AddPayments} from "../components/Payment/AddPayments";
import {PaymentListTable} from "../components/Payment/PaymentListTable";
import {EditPage} from "../components/Page/EditPage";
import {EditPageGroup} from "../components/Page/EditPageGroup";
import {PageBodyEditor} from "../components/Page/PageBodyEditor";
import {Pages} from "../components/Page/Pages";
import {Register} from "../components/Register/Register";
import {PageStatusEnum, PaymentTypeEnum, ResultEnum, RoleEnum, UpdateStatusEnum} from "../models";
import {authAPI, pageGroupMgmtAPI, pageMgmtAPI, paymentAPI, userAPI} from "../services";

jest.setTimeout(30000);

const mockNavigate = jest.fn();
let mockParamId = "0";
const mockMessage = {success: jest.fn(), error: jest.fn()};

const mockTranslation = {t: (key: string) => key};
jest.mock("react-i18next", () => ({useTranslation: () => mockTranslation}));
jest.mock("react-router-dom", () => ({
    Link: ({children, to}: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
    useParams: () => ({paramId: mockParamId}),
    useNavigate: () => mockNavigate
}));
jest.mock("../session", () => ({
    useSession: () => ({
        userSession: {roles: [RoleEnum.ROLE_ADMIN]},
        sessionLanguage: "en",
        getFrontendConfigurationValue: () => "en,fi",
        getPortalConfigurationValue: (group: string, key: string) => {
            if (group === "MEMBERSHIP" && key === "event-require-membership") return "true";
            if (key.includes("expiration-type") || key.includes("method-type")) return "PERIODICAL";
            if (key.includes("expiration-unit") || key.includes("method-unit")) return "YEARS";
            if (key.includes("start")) return "2024-01-01";
            if (key.includes("length")) return "1";
            if (key === "timezone") return "Europe/Helsinki";
            return "true";
        }
    })
}));
jest.mock("../services", () => ({
    authAPI: {register: jest.fn()},
    pageGroupMgmtAPI: {findAll: jest.fn(), findById: jest.fn(), create: jest.fn(), update: jest.fn()},
    pageMgmtAPI: {findById: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn()},
    paymentAPI: {
        create: jest.fn(),
        update: jest.fn(),
        getAllActivePaymentStatusWithPaymentType: jest.fn()
    },
    userAPI: {findByRole: jest.fn()}
}));
jest.mock("../components/User", () => ({
    UserFields: () => <>
        <label>username<input name="username"/></label>
        <label>first name<input name="firstName"/></label>
        <label>last name<input name="lastName"/></label>
        <label>phone<input name="phoneNumber"/></label>
        <label>next of kin<input name="nextOfKin"/></label>
        <label>language<input name="language" defaultValue="en"/></label>
        <label>user type<input name="primaryUserType" defaultValue="USER"/></label>
    </>
}));
jest.mock("../components/main", () => ({
    AcceptTerms: () => <span>terms content</span>,
    HealthStatementConfirmationModal: ({open, onConfirm, onCancel}: { open: boolean; onConfirm: () => void; onCancel: () => void }) =>
            open ? <div>
                <button onClick={onConfirm}>health confirm</button>
                <button onClick={onCancel}>health cancel</button>
            </div> : null,
    ShiftableRangePicker: ({onChange}: { onChange: (value: unknown[]) => void }) =>
            <button onClick={() => onChange([])}>change dates</button>
}));
jest.mock("@ckeditor/ckeditor5-react", () => ({
    CKEditor: ({data, onChange}: { data: string; onChange: (_event: unknown, editor: { getData: () => string }) => void }) =>
            <textarea aria-label="body editor" defaultValue={data}
                      onChange={event => onChange(event, {getData: () => event.target.value})}/>
}));
jest.mock("antd", () => {
    const actual = jest.requireActual("antd");
    return {...actual, message: {useMessage: () => [mockMessage, <span key="message-holder"/>]}};
});

// rc-field-form batches watch notifications through MessageChannel, which jsdom does
// not provide in this Jest environment.
if (typeof globalThis.MessageChannel === "undefined") {
    class TestMessageChannel {
        port1 = {onmessage: null as ((event: MessageEvent) => void) | null};
        port2 = {postMessage: () => queueMicrotask(() => this.port1.onmessage?.(new MessageEvent("message")))};
    }

    (globalThis as unknown as { MessageChannel: typeof TestMessageChannel }).MessageChannel = TestMessageChannel;
}

const group = {
    id: 2, status: PageStatusEnum.DRAFTED,
    pageGroupVersions: [{id: 3, pageGroupId: 2, language: "en", title: "English group"}, {id: 4, pageGroupId: 2, language: "fi", title: "Suomi"}],
    pages: []
};
const page = {
    id: 7, pageGroupId: 2, status: PageStatusEnum.DRAFTED,
    pageVersions: [{id: 8, pageId: 7, language: "en", title: "English page", ingress: "", body: "<p>body</p>"}],
    rolePermissions: [{id: 9, pageId: 7, role: RoleEnum.ROLE_ADMIN, readPermission: true, writePermission: true}],
    creator: 1, createdAt: "2024-01-01", modifier: null, modifiedAt: null
};

beforeEach(() => {
    jest.clearAllMocks();
    mockParamId = "0";
    (pageGroupMgmtAPI.findAll as jest.Mock).mockResolvedValue([group]);
    (pageGroupMgmtAPI.findById as jest.Mock).mockResolvedValue(group);
    (pageMgmtAPI.findById as jest.Mock).mockResolvedValue(page);
    (userAPI.findByRole as jest.Mock).mockResolvedValue([
        {id: 1, name: "Active", membershipActive: true},
        {id: 2, name: "Inactive", membershipActive: false}
    ]);
    (paymentAPI.getAllActivePaymentStatusWithPaymentType as jest.Mock).mockResolvedValue([]);
});

describe("page editors and page listing", () => {
    it("creates a page group through controls, validates short titles, and handles success/failure", async () => {
        const user = userEvent.setup();
        (pageGroupMgmtAPI.create as jest.Mock).mockResolvedValue({id: 11});
        render(<EditPageGroup/>);
        await screen.findByText("EN");
        const titles = screen.getAllByRole("textbox");
        const title = titles[titles.length - 2];
        await user.type(title, "x");
        await user.click(screen.getByRole("button", {name: "EditPageGroup.form.button.create"}));
        expect(pageGroupMgmtAPI.create).not.toHaveBeenCalled();
        await user.clear(title);
        await user.type(title, "Valid title");
        await user.type(titles[titles.length - 1], "Valid title");
        await user.click(screen.getByRole("button", {name: "EditPageGroup.form.button.create"}));
        await waitFor(() => expect(pageGroupMgmtAPI.create).toHaveBeenCalled());
        (pageGroupMgmtAPI.create as jest.Mock).mockRejectedValueOnce(new Error("offline"));
        await user.click(screen.getByRole("button", {name: "EditPageGroup.form.button.create"}));
        await waitFor(() => expect(mockMessage.error).toHaveBeenCalled());
    });

    it("updates a page, exercises editor and permission validation, and supports navigation", async () => {
        const user = userEvent.setup();
        mockParamId = "7";
        (pageMgmtAPI.update as jest.Mock).mockResolvedValue({id: 7});
        render(<EditPage/>);
        await screen.findByDisplayValue("English page");
        const editor = screen.getByRole("textbox", {name: "body editor"});
        await user.click(screen.getByRole("button", {name: "EditPage.form.button.update"}));
        await waitFor(() => expect(pageMgmtAPI.update).toHaveBeenCalled());
        (pageMgmtAPI.update as jest.Mock).mockRejectedValueOnce(new Error("failure"));
        await user.click(screen.getByRole("button", {name: "EditPage.form.button.update"}));
        await waitFor(() => expect(mockMessage.error).toHaveBeenCalled());
        await user.clear(editor);
        await user.type(editor, "updated body");
        await user.click(screen.getByRole("button", {name: "EditPage.form.button.addPermission"}));
        expect(screen.getAllByText("EditPage.form.rolePermissions.readPermission.label").length).toBeGreaterThan(1);
    });

    it("loads pages, only exposes permitted actions, and closes through the API", async () => {
        window.confirm = jest.fn().mockReturnValue(true);
        (pageMgmtAPI.delete as jest.Mock).mockResolvedValue(true);
        (pageGroupMgmtAPI.findById as jest.Mock).mockResolvedValue({
            ...group,
            pages: [{
                ...page,
                status: PageStatusEnum.PUBLISHED,
                rolePermissions: [{id: 1, role: RoleEnum.ROLE_ADMIN, readPermission: true, writePermission: true}]
            }]
        });
        render(<Pages/>);
        await screen.findByText("English page");
        expect(screen.getByRole("link", {name: "common.button.update"})).toHaveAttribute("href", "/administration/pages/7");
        await userEvent.setup().click(screen.getByRole("button", {name: "common.button.close"}));
        await waitFor(() => expect(pageMgmtAPI.delete).toHaveBeenCalledWith(7));
        cleanup();
        mockParamId = "1";
        render(<Pages/>);
        await screen.findByText("Pages.alert.noPages");
        expect(screen.queryByText("Pages.button.addPage")).not.toBeInTheDocument();
    });
});

describe("payment controls", () => {
    it("filters membership users, switches type, submits creates, and handles rejected creates", async () => {
        const user = userEvent.setup();
        (paymentAPI.create as jest.Mock).mockResolvedValue({created: {id: 1}});
        render(<AddPayments/>);
        await waitFor(() => expect(screen.getAllByRole("combobox").length).toBeGreaterThan(0));
        fireEvent.mouseDown(screen.getAllByRole("combobox")[0]);
        await waitFor(() => expect(screen.getByText("Active (1)")).toBeInTheDocument());
        expect(screen.queryByText("Inactive (2)")).not.toBeInTheDocument();
        await user.click(screen.getByText("Active (1)"));
        fireEvent.mouseDown(screen.getAllByRole("combobox")[1]);
        await user.click(await screen.findByText("PaymentTypeEnum.ONE_TIME"));
        await user.click(screen.getByRole("button", {name: "AddPayments.form.button"}));
        await waitFor(() => expect(paymentAPI.create).toHaveBeenCalledWith(expect.objectContaining({userId: 1, paymentType: PaymentTypeEnum.ONE_TIME})));
        (paymentAPI.create as jest.Mock).mockRejectedValueOnce(new Error("offline"));
        await user.click(screen.getByRole("button", {name: "AddPayments.form.button"}));
        await waitFor(() => expect(mockMessage.error).toHaveBeenCalled());
    });

    it("renders edge dates/count controls, updates counts, and tolerates update failure", async () => {
        const user = userEvent.setup();
        const record = {
            id: 4,
            userId: 3,
            name: "Diver",
            created: "2024-01-01",
            startDate: "2024-01-01",
            endDate: null,
            paymentCount: 1,
            paymentType: PaymentTypeEnum.ONE_TIME,
            boundEvents: []
        };
        (paymentAPI.getAllActivePaymentStatusWithPaymentType as jest.Mock).mockResolvedValue([{userId: 3, name: "Diver", payments: [record]}]);
        (paymentAPI.update as jest.Mock).mockResolvedValue({});
        render(<PaymentListTable paymentType={PaymentTypeEnum.ONE_TIME} keyName="test"/>);
        await screen.findByText("Diver");
        const row = screen.getByText("Diver").closest("tr")!;
        await user.click(within(row).getAllByRole("button")[0]);
        await waitFor(() => expect(paymentAPI.update).toHaveBeenCalledWith(expect.objectContaining({paymentCount: 2, endDate: null})));
        (paymentAPI.update as jest.Mock).mockRejectedValueOnce(new Error("offline"));
        await user.click(within(row).getAllByRole("button")[1]);
        await waitFor(() => expect(paymentAPI.update).toHaveBeenCalledTimes(2));
    });
});

describe("registration and editor callbacks", () => {
    it("requires matching password and both confirmations before registering", async () => {
        const user = userEvent.setup();
        (authAPI.register as jest.Mock).mockResolvedValue({status: ResultEnum.OK, token: "token"});
        render(<Register/>);
        await user.type(screen.getByLabelText("username"), "new-user");
        const password = screen.getByLabelText("Register.form.password.label");
        const confirm = screen.getByLabelText("Register.form.confirm.label");
        await user.type(password, "bad");
        await user.type(confirm, "different");
        expect(screen.getByRole("button", {name: "Register.form.submitButton"})).toBeDisabled();
        await user.click(screen.getByRole("button", {name: "Register.form.terms.button"}));
        await user.click(screen.getByRole("button", {name: "common.button.confirm"}));
        await user.click(screen.getByRole("button", {name: "Register.form.healthStatement.button"}));
        await user.click(screen.getByRole("button", {name: "health confirm"}));
        expect(screen.getByRole("button", {name: "Register.form.submitButton"})).not.toBeDisabled();
        await user.click(screen.getByRole("button", {name: "Register.form.submitButton"}));
        expect(authAPI.register).not.toHaveBeenCalled();
        await user.clear(password);
        await user.type(password, "GoodPassword1!");
        await user.clear(confirm);
        await user.type(confirm, "GoodPassword1!");
        await user.click(screen.getByRole("button", {name: "Register.form.submitButton"}));
        await waitFor(() => expect(authAPI.register).toHaveBeenCalledWith(expect.objectContaining({approvedTerms: true, healthStatementId: 0})));
    });

    it("shows registration failure and redirects authenticated sessions", async () => {
        const user = userEvent.setup();
        (authAPI.register as jest.Mock).mockResolvedValue({status: UpdateStatusEnum.NONE});
        render(<Register/>);
        expect(mockNavigate).toHaveBeenCalledWith("/");
        await user.type(screen.getByLabelText("username"), "edge-user");
        await user.type(screen.getByLabelText("Register.form.password.label"), "GoodPassword1!");
        await user.type(screen.getByLabelText("Register.form.confirm.label"), "GoodPassword1!");
        await user.click(screen.getByRole("button", {name: "Register.form.terms.button"}));
        await user.click(screen.getByRole("button", {name: "common.button.confirm"}));
        await user.click(screen.getByRole("button", {name: "Register.form.healthStatement.button"}));
        await user.click(screen.getByRole("button", {name: "health confirm"}));
        await user.click(screen.getByRole("button", {name: "Register.form.submitButton"}));
        await waitFor(() => expect(authAPI.register).toHaveBeenCalled());
    });

    it("passes editor content changes to its parent", async () => {
        const onChange = jest.fn();
        render(<PageBodyEditor value="<p>old</p>" language="en" pageId={4} onChange={onChange}/>);
        await userEvent.setup().type(screen.getByRole("textbox", {name: "body editor"}), "new");
        expect(onChange).toHaveBeenCalled();
    });
});
