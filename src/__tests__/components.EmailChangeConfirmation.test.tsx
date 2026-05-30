import {fireEvent, render, screen} from "@testing-library/react";
import type {ReactNode} from "react";
import {EmailChangeConfirmation} from "../components/User/EmailChangeConfirmation";

const mockNavigate = jest.fn();
const mockLogoutUser = jest.fn();
const mockUseSearchParams = jest.fn();

jest.mock("../session", () => ({
    useSession: () => ({
        logoutUser: mockLogoutUser
    })
}));

jest.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string) => key
    })
}));

jest.mock("react-router-dom", () => ({
    useNavigate: () => mockNavigate,
    useSearchParams: () => mockUseSearchParams()
}));

jest.mock("antd", () => ({
    Alert: ({message, title}: { message?: string; title?: string }) => <div>{title ?? message}</div>,
    Button: ({children, onClick}: { children: ReactNode; onClick?: () => void }) => <button onClick={onClick}>{children}</button>,
    Space: ({children}: { children: ReactNode }) => <div>{children}</div>
}));

describe("EmailChangeConfirmation", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("logs out current session and shows success path when status is OK", () => {
        mockUseSearchParams.mockReturnValue([new URLSearchParams("status=OK")]);

        render(<EmailChangeConfirmation/>);

        expect(mockLogoutUser).toHaveBeenCalledTimes(1);
        expect(screen.getByText("User.emailChange.confirmation.ok")).toBeInTheDocument();

        fireEvent.click(screen.getByText("common.button.login"));
        expect(mockNavigate).toHaveBeenCalledWith("/login");
    });

    it("keeps session and shows invalid message when status is INVALID", () => {
        mockUseSearchParams.mockReturnValue([new URLSearchParams("status=INVALID")]);

        render(<EmailChangeConfirmation/>);

        expect(mockLogoutUser).not.toHaveBeenCalled();
        expect(screen.getByText("User.emailChange.confirmation.invalid")).toBeInTheDocument();

        fireEvent.click(screen.getByText("common.button.back"));
        expect(mockNavigate).toHaveBeenCalledWith("/");
    });
});


