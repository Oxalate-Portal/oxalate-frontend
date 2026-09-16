import {type ReactNode} from "react";
import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import {NavigationBar} from "../components/main/NavigationBar";
import {pageAPI} from "../services";

const mockDesktop = {value: false};
const mockSession = {
    userSession: {id: 1, username: "admin", roles: ["ROLE_ADMIN"], avatarUrl: null},
    logoutUser: jest.fn(),
    sessionLanguage: "en",
    organizationName: "Test Portal",
    setSessionLanguage: jest.fn(),
    getPortalConfigurationValue: jest.fn((...[, key]: [string, string]) => {
        if (key === "membership-type") return "PERIODICAL";
        if (key === "commenting-enabled") return "true";
        if (key === "commenting-enabled-features") return "forum";
        if (key === "blog-enabled") return "true";
        return "";
    }),
    getFrontendConfigurationValue: jest.fn(() => "en,fi")
};

jest.mock("react-i18next", () => ({useTranslation: () => ({t: (key: string) => key})}));
jest.mock("react-router-dom", () => ({
    NavLink: ({children, to, onClick}: { children: ReactNode; to: string; onClick?: () => void }) =>
        <a href={to} onClick={onClick}>{children}</a>
}));
jest.mock("../session", () => ({useSession: () => mockSession}));
jest.mock("../services", () => ({pageAPI: {getNavigationItems: jest.fn()}}));
jest.mock("../tools", () => ({
    checkRoles: () => true,
    LanguageTool: {getLabelByValue: (value: string) => value.toUpperCase()}
}));
jest.mock("../components/Notification", () => ({NotificationDropdown: () => <span>notifications</span>}));
jest.mock("../components/Blogging", () => ({useBlogMenuItems: () => []}));
jest.mock("../../portal_logo.svg?react", () => () => <span>logo</span>);
jest.mock("@ant-design/icons", () => new Proxy({}, {get: () => () => <span/>}));
jest.mock("antd", () => {
    const renderItems = (items: Array<{ key?: string; label?: ReactNode; children?: Array<unknown> }>): ReactNode[] =>
        items.flatMap(item => [
            <button key={item.key} onClick={() => mockMenuClick?.({key: item.key})}>{item.label}</button>,
            ...(item.children ? renderItems(item.children as Array<{ key?: string; label?: ReactNode; children?: Array<unknown> }>) : [])
        ]);
    let mockMenuClick: ((event: { key?: string }) => void) | undefined;
    const Menu = ({items = [], onClick}: {
        items?: Array<{ key?: string; label?: ReactNode; children?: Array<unknown> }>;
        onClick?: (event: { key?: string }) => void
    }) => {
        mockMenuClick = onClick;
        return <nav>{renderItems(items)}</nav>;
    };
    const Header = ({children}: { children: ReactNode }) => <header>{children}</header>;
    return {
        Avatar: () => <span>avatar</span>,
        Button: ({children, onClick, "aria-label": ariaLabel}: { children?: ReactNode; onClick?: () => void; "aria-label"?: string }) =>
            <button aria-label={ariaLabel} onClick={onClick}>{children}</button>,
        Drawer: ({children, open, onClose}: { children: ReactNode; open?: boolean; onClose?: () => void }) =>
            open ? <aside>
                <button onClick={onClose}>close</button>
                {children}</aside> : null,
        Grid: {useBreakpoint: () => ({md: mockDesktop.value})},
        Layout: {Header},
        Menu,
        Tooltip: ({children}: { children: ReactNode }) => <span>{children}</span>
    };
});

describe("NavigationBar behavior", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockDesktop.value = false;
        (pageAPI.getNavigationItems as jest.Mock).mockResolvedValue([
            {
                id: 1,
                pageGroupVersions: [{title: "Pages"}],
                pages: [{id: 2, pageVersions: [{title: "Home"}], slug: "home"}]
            }
        ]);
    });

    it("loads mobile navigation, opens the drawer, and closes it after selection", async () => {
        render(<NavigationBar/>);
        await waitFor(() => expect(pageAPI.getNavigationItems).toHaveBeenCalledWith("en"));
        fireEvent.click(screen.getByRole("button", {name: "Open menu"}));
        expect(screen.getByRole("complementary")).toBeInTheDocument();
        fireEvent.click(screen.getByText("NavigationBar.action.logout"));
        expect(mockSession.logoutUser).toHaveBeenCalled();
    });

    it("keeps the navigation hidden while loading fails", async () => {
        const error = jest.spyOn(console, "error").mockImplementation(() => undefined);
        (pageAPI.getNavigationItems as jest.Mock).mockRejectedValue(new Error("navigation unavailable"));
        render(<NavigationBar/>);
        await waitFor(() => expect(error).toHaveBeenCalledWith("Failed to load navigation items: Error: navigation unavailable"));
    });
});
