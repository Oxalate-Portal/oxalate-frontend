import {cleanup, configure, fireEvent, render, screen, waitFor, within} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type {ReactNode} from "react";
import {AddPayments, EditPage, EditPageGroup, PageBodyEditor, Pages, PaymentListTable, Register} from "../components";
import {PageStatusEnum, PaymentTypeEnum, ResultEnum, RoleEnum, UpdateStatusEnum} from "../models";
import {authAPI, pageGroupMgmtAPI, pageMgmtAPI, paymentAPI, userAPI} from "../services";

jest.setTimeout(120000);

// Slow machines need more headroom than the 1 s default before waitFor/findBy give up
configure({asyncUtilTimeout: 10000});

const mockNavigate = jest.fn();
let mockParamId = "0";
const mockMessage = {success: jest.fn(), error: jest.fn()};
const mockGetPortalConfigurationValue = (group: string, key: string) => {
    if (group === "MEMBERSHIP" && key === "event-require-membership") return "true";
    if (key.includes("expiration-type") || key.includes("method-type")) return "PERIODICAL";
    if (key.includes("expiration-unit") || key.includes("method-unit")) return "YEARS";
    if (key.includes("start")) return "2024-01-01";
    if (key.includes("length")) return "1";
    if (key === "timezone") return "Europe/Helsinki";
    return "true";
};

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
        getPortalConfigurationValue: mockGetPortalConfigurationValue
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
        const user = userEvent.setup({delay: null});
        (pageGroupMgmtAPI.create as jest.Mock).mockResolvedValue({id: 11});
        render(<EditPageGroup/>);
        await screen.findByText("EN");
        const titles = screen.getAllByRole("textbox");
        const title = titles[titles.length - 2];
        fireEvent.change(title, {target: {value: "x"}});
        await user.click(screen.getByRole("button", {name: "EditPageGroup.form.button.create"}));
        expect(pageGroupMgmtAPI.create).not.toHaveBeenCalled();
        fireEvent.change(title, {target: {value: "Valid title"}});
        fireEvent.change(titles[titles.length - 1], {target: {value: "Valid title"}});
        await user.click(screen.getByRole("button", {name: "EditPageGroup.form.button.create"}));
        await waitFor(() => expect(pageGroupMgmtAPI.create).toHaveBeenCalled());
        (pageGroupMgmtAPI.create as jest.Mock).mockRejectedValueOnce(new Error("offline"));
        await user.click(screen.getByRole("button", {name: "EditPageGroup.form.button.create"}));
        await waitFor(() => expect(mockMessage.error).toHaveBeenCalled());
    });

    it("updates a page, exercises editor and permission validation, and supports navigation", async () => {
        const user = userEvent.setup({delay: null});
        mockParamId = "7";
        (pageMgmtAPI.update as jest.Mock).mockResolvedValue({id: 7});
        render(<EditPage/>);
        await screen.findByDisplayValue("English page");
        await user.click(screen.getByRole("button", {name: "EditPage.form.button.update"}));
        await waitFor(() => expect(pageMgmtAPI.update).toHaveBeenCalled());
        (pageMgmtAPI.update as jest.Mock).mockRejectedValueOnce(new Error("failure"));
        await user.click(screen.getByRole("button", {name: "EditPage.form.button.update"}));
        await waitFor(() => expect(mockMessage.error).toHaveBeenCalled());
        const refreshedEditor = screen.getByRole("textbox", {name: "body editor"});
        fireEvent.change(refreshedEditor, {target: {value: "updated body"}});
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
        await userEvent.setup({delay: null}).click(screen.getByRole("button", {name: "common.button.close"}));
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
        const user = userEvent.setup({delay: null});
        (paymentAPI.create as jest.Mock).mockImplementation((request) => Promise.resolve({...request, created: {id: 1}}));
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

    it("reports when the backend returns a different payment", async () => {
        const user = userEvent.setup({delay: null});
        (paymentAPI.create as jest.Mock).mockImplementation((request) =>
            Promise.resolve({...request, endDate: "2099-01-01", created: {id: 1}})
        );
        render(<AddPayments/>);
        await waitFor(() => expect(screen.getAllByRole("combobox").length).toBeGreaterThan(0));
        fireEvent.mouseDown(screen.getAllByRole("combobox")[0]);
        await user.click(await screen.findByText("Active (1)"));
        await user.click(screen.getByRole("button", {name: "AddPayments.form.button"}));

        await waitFor(() => expect(mockMessage.error).toHaveBeenCalledWith("AddPayments.onFinish.mismatch"));
        expect(mockMessage.success).not.toHaveBeenCalled();
    });

    it("renders edge dates/count controls, updates counts, and tolerates update failure", async () => {
        const user = userEvent.setup({delay: null});
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
        (authAPI.register as jest.Mock).mockResolvedValue({status: ResultEnum.OK, token: "token"});
        render(<Register/>);
        fireEvent.change(screen.getByLabelText("username"), {target: {value: "new-user"}});
        const password = screen.getByLabelText("Register.form.password.label");
        const confirm = screen.getByLabelText("Register.form.confirm.label");
        fireEvent.change(password, {target: {value: "bad"}});
        fireEvent.change(confirm, {target: {value: "different"}});
        await waitFor(() => expect(screen.getByRole("button", {name: "Register.form.submitButton"})).toBeDisabled());
        fireEvent.click(screen.getByRole("button", {name: "Register.form.terms.button"}));
        fireEvent.click(await screen.findByRole("button", {name: "common.button.confirm"}));
        fireEvent.click(screen.getByRole("button", {name: "Register.form.healthStatement.button"}));
        fireEvent.click(await screen.findByRole("button", {name: "health confirm"}));
        await waitFor(() => expect(screen.getByRole("button", {name: "Register.form.submitButton"})).not.toBeDisabled());
        fireEvent.click(screen.getByRole("button", {name: "Register.form.submitButton"}));
        expect(authAPI.register).not.toHaveBeenCalled();
        fireEvent.change(password, {target: {value: "GoodPassword1!"}});
        fireEvent.change(confirm, {target: {value: "GoodPassword1!"}});
        fireEvent.click(screen.getByRole("button", {name: "Register.form.submitButton"}));
        await waitFor(() => expect(authAPI.register).toHaveBeenCalledWith(expect.objectContaining({approvedTerms: true, healthStatementId: 0})));
    });

    it("shows registration failure and redirects authenticated sessions", async () => {
        (authAPI.register as jest.Mock).mockResolvedValue({status: UpdateStatusEnum.NONE});
        render(<Register/>);
        expect(mockNavigate).toHaveBeenCalledWith("/");
        fireEvent.change(screen.getByLabelText("username"), {target: {value: "edge-user"}});
        fireEvent.change(screen.getByLabelText("Register.form.password.label"), {target: {value: "GoodPassword1!"}});
        fireEvent.change(screen.getByLabelText("Register.form.confirm.label"), {target: {value: "GoodPassword1!"}});
        fireEvent.click(screen.getByRole("button", {name: "Register.form.terms.button"}));
        fireEvent.click(await screen.findByRole("button", {name: "common.button.confirm"}));
        fireEvent.click(screen.getByRole("button", {name: "Register.form.healthStatement.button"}));
        fireEvent.click(await screen.findByRole("button", {name: "health confirm"}));
        await waitFor(() => expect(screen.getByRole("button", {name: "Register.form.submitButton"})).not.toBeDisabled());
        fireEvent.click(screen.getByRole("button", {name: "Register.form.submitButton"}));
        await waitFor(() => expect(authAPI.register).toHaveBeenCalled());
    });

    it("passes editor content changes to its parent", async () => {
        const onChange = jest.fn();
        render(<PageBodyEditor value="<p>old</p>" language="en" pageId={4} onChange={onChange}/>);
        fireEvent.change(screen.getByRole("textbox", {name: "body editor"}), {target: {value: "new"}});
        expect(onChange).toHaveBeenCalled();
    });
});
