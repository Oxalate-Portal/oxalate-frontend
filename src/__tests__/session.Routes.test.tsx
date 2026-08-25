import {render, screen} from "@testing-library/react";
import {MemoryRouter} from "react-router-dom";
import {AdminRoute} from "../session/AdminRoute";
import {OrganizerRoute} from "../session/OrganizerRoute";
import {PrivateRoute} from "../session/PrivateRoute";
import {AuthVerify} from "../session/AuthVerify";
import {RoleEnum} from "../models";
import {useSession} from "../session/useSession";

jest.mock("../session/useSession", () => ({
    useSession: jest.fn()
}));

const mockedUseSession = jest.mocked(useSession);
const child = <span data-testid="protected">protected</span>;

function renderRoute(element: React.ReactElement) {
    return render(<MemoryRouter>{element}</MemoryRouter>);
}

describe("session route guards", () => {
    beforeEach(() => jest.clearAllMocks());

    it.each([
        ["private", PrivateRoute],
        ["admin", AdminRoute],
        ["organizer", OrganizerRoute]
    ])("redirects unauthenticated %s users to login", (_, Route) => {
        mockedUseSession.mockReturnValue({userSession: null} as ReturnType<typeof useSession>);
        renderRoute(<Route>{child}</Route>);
        expect(screen.queryByTestId("protected")).not.toBeInTheDocument();
    });

    it("allows an authenticated user through PrivateRoute", () => {
        mockedUseSession.mockReturnValue({userSession: {roles: []}} as ReturnType<typeof useSession>);
        renderRoute(<PrivateRoute>{child}</PrivateRoute>);
        expect(screen.getByTestId("protected")).toBeInTheDocument();
    });

    it("allows only administrators through AdminRoute", () => {
        mockedUseSession.mockReturnValue({userSession: {roles: [RoleEnum.ROLE_ADMIN]}} as ReturnType<typeof useSession>);
        renderRoute(<AdminRoute>{child}</AdminRoute>);
        expect(screen.getByTestId("protected")).toBeInTheDocument();

        mockedUseSession.mockReturnValue({userSession: {roles: [RoleEnum.ROLE_ORGANIZER]}} as ReturnType<typeof useSession>);
        renderRoute(<AdminRoute>{child}</AdminRoute>);
        expect(screen.queryAllByTestId("protected")).toHaveLength(1);
    });

    it("allows administrators and organizers through OrganizerRoute", () => {
        for (const role of [RoleEnum.ROLE_ADMIN, RoleEnum.ROLE_ORGANIZER]) {
            mockedUseSession.mockReturnValue({userSession: {roles: [role]}} as ReturnType<typeof useSession>);
            const {unmount} = renderRoute(<OrganizerRoute>{child}</OrganizerRoute>);
            expect(screen.getByTestId("protected")).toBeInTheDocument();
            unmount();
        }

        mockedUseSession.mockReturnValue({userSession: {roles: [RoleEnum.ROLE_USER]}} as ReturnType<typeof useSession>);
        renderRoute(<OrganizerRoute>{child}</OrganizerRoute>);
        expect(screen.queryByTestId("protected")).not.toBeInTheDocument();
    });
});

describe("AuthVerify", () => {
    beforeEach(() => localStorage.clear());

    it("logs out expired sessions and leaves valid sessions alone", () => {
        const logOut = jest.fn();
        localStorage.setItem("user", JSON.stringify({expiresAt: "2000-01-01T00:00:00.000Z"}));
        render(<MemoryRouter><AuthVerify logOut={logOut}/></MemoryRouter>);
        expect(logOut).toHaveBeenCalledTimes(1);

        logOut.mockClear();
        localStorage.setItem("user", JSON.stringify({expiresAt: "2999-01-01T00:00:00.000Z"}));
        render(<MemoryRouter><AuthVerify logOut={logOut}/></MemoryRouter>);
        expect(logOut).not.toHaveBeenCalled();
    });

    it("does nothing for an anonymous session", () => {
        const logOut = jest.fn();
        render(<MemoryRouter><AuthVerify logOut={logOut}/></MemoryRouter>);
        expect(logOut).not.toHaveBeenCalled();
    });
});
