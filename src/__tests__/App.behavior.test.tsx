import {render, screen, waitFor} from "@testing-library/react";
import type {ReactNode} from "react";
import {MemoryRouter} from "react-router-dom";
import App from "../App";

const session = {
    userSession: null as null | { approvedTerms: boolean },
    sessionLanguage: "en",
    organizationName: "Test portal",
    logoutUser: jest.fn(),
    getPortalTimezone: jest.fn(() => "UTC"),
    getPortalConfigurationValue: jest.fn((group: string, key: string) => {
        if (key === "membership-type") return "disabled";
        if (key === "commenting-enabled") return "false";
        return group === "general" && key === "blog-enabled" ? "true" : "";
    })
};

jest.mock("../session", () => ({
    AdminRoute: ({children}: { children: ReactNode }) => <>{children}</>,
    AuthVerify: () => <div data-testid="auth-verify"/>,
    OrganizerRoute: ({children}: { children: ReactNode }) => <>{children}</>,
    PrivateRoute: ({children}: { children: ReactNode }) => <>{children}</>,
    useSession: () => session
}));

jest.mock("i18next", () => ({
    __esModule: true,
    default: {language: "en", changeLanguage: jest.fn().mockResolvedValue(undefined)}
}));

jest.mock("antd", () => ({
    ConfigProvider: ({children}: { children: ReactNode }) => <>{children}</>,
    theme: {darkAlgorithm: {}}
}));

jest.mock("../components", () => {
    const names = [
        "AcceptTerms", "AdminMain", "AdminMembership", "AdminMemberships", "AdminNotifications",
        "AdminOrgUser", "AdminOrgUsers", "AdminUploads", "AuditEvents", "BlockedDates",
        "CommentList", "CommentModeration", "DiveEvent", "DiveEvents", "DownloadData",
        "EditCertificate", "EditDiveEvent", "EditPage", "EditPageGroup", "EmailChangeConfirmation",
        "Forum", "Home", "LoginWithCaptcha", "LostPassword", "MainAdminStatistics",
        "NavigationBar", "NewPassword", "NotificationList", "OxalateFooter", "Page", "PageGroups",
        "Pages", "Password", "PastDiveEvents", "Payments", "PortalConfigurations", "Register",
        "Registration", "SetDives", "ShowDiveEvent", "ShowUser", "UserProfile", "YearlyDiveStats"
    ];
    return Object.fromEntries(names.map(name => [
        name,
        ({registration}: { registration?: boolean }) =>
                <div data-testid={name}>{registration === false ? "terms" : name}</div>
    ]));
});

jest.mock("../components/Administration/AdminTags", () => ({
    AdminTags: () => <div data-testid="AdminTags"/>
}));
jest.mock("../components/Administration/AdminTagGroups", () => ({
    AdminTagGroups: () => <div data-testid="AdminTagGroups"/>
}));
jest.mock("../components/Blogging", () => ({
    Blog: () => <div data-testid="Blog"/>
}));

describe("App routing and session behavior", () => {
    beforeEach(() => {
        session.userSession = null;
        session.sessionLanguage = "en";
        session.getPortalConfigurationValue.mockImplementation((group: string, key: string) => {
            if (key === "membership-type") return "disabled";
            if (key === "commenting-enabled") return "false";
            return group === "general" && key === "blog-enabled" ? "true" : "";
        });
        document.title = "";
    });

    it("renders public routes and updates the document title", async () => {
        render(<MemoryRouter initialEntries={["/"]}><App/></MemoryRouter>);
        expect(screen.getByTestId("NavigationBar")).toBeInTheDocument();
        expect(screen.getByTestId("Home")).toBeInTheDocument();
        expect(screen.getByTestId("auth-verify")).toBeInTheDocument();
        await waitFor(() => expect(document.title).toBe("Test portal"));
    });

    it("renders terms gate for an authenticated user who has not accepted terms", () => {
        session.userSession = {approvedTerms: false};
        render(<MemoryRouter initialEntries={["/"]}><App/></MemoryRouter>);
        expect(screen.getByTestId("AcceptTerms")).toHaveTextContent("terms");
        expect(screen.getByTestId("Home")).toBeInTheDocument();
        expect(screen.queryByTestId("auth-verify")).toBeInTheDocument();
    });

    it("handles configured language and protected routes", async () => {
        session.userSession = {approvedTerms: true};
        session.sessionLanguage = "fi";
        session.getPortalConfigurationValue.mockImplementation(((group: string, key: string) => {
            if (key === "membership-type") return "enabled";
            if (key === "commenting-enabled") return "true";
            return group === "general" && key === "blog-enabled" ? "true" : "";
        }) as never);
        render(<MemoryRouter initialEntries={["/administration/main"]}><App/></MemoryRouter>);
        expect(screen.getByTestId("AdminMain")).toBeInTheDocument();
        await waitFor(() => expect(document.title).toBe("Test portal"));
    });
});
