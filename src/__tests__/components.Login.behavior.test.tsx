import {type ReactNode} from "react";
import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import {Login} from "../components/main/Login";

const mockNavigate = jest.fn();
const mockLoginUser = jest.fn();
const mockExecuteRecaptcha = jest.fn();
let mockRecaptchaEnabled = true;

jest.mock("react-i18next", () => ({useTranslation: () => ({t: (key: string) => key})}));
jest.mock("react-router-dom", () => ({useNavigate: () => mockNavigate}));
jest.mock("../session", () => ({useSession: () => ({loginUser: mockLoginUser})}));
jest.mock("@wojtekmaj/react-recaptcha-v3", () => ({
    useReCaptcha: () => mockRecaptchaEnabled ? {executeRecaptcha: mockExecuteRecaptcha} : {}
}));
jest.mock("antd", () => {
    const Form = ({children, onFinish, onFinishFailed}: {
        children: ReactNode;
        onFinish?: (values: unknown) => void;
        onFinishFailed?: (error: unknown) => void
    }) =>
        <form onSubmit={event => {
            event.preventDefault();
            onFinish?.({username: "user@example.com", password: "secret"});
        }}>
            {children}
            <button type="button" data-testid="form-submit" onClick={() => onFinish?.({username: "user@example.com", password: "secret"})}/>
            <button type="button" data-testid="invalid-submit" onClick={() => onFinishFailed?.({errorFields: [{errors: ["required"]}]})}/>
        </form>;
    Form.Item = ({children}: { children: ReactNode }) => <div>{children}</div>;
    const Input = (props: Record<string, unknown>) => <input {...props}/>;
    Input.Password = Input;
    const Grid = {useBreakpoint: () => ({})};
    return {
        Alert: ({title, action}: { title: string; action: ReactNode }) => <div role="alert">{title}{action}</div>,
        Button: ({children, onClick, htmlType}: { children: ReactNode; onClick?: () => void; htmlType?: string }) =>
            <button type={htmlType === "submit" ? "submit" : "button"} onClick={onClick}>{children}</button>,
        Form,
        Grid,
        Input,
        Row: ({children}: { children: ReactNode }) => <div>{children}</div>,
        Space: ({children}: { children: ReactNode }) => <div>{children}</div>
    };
});

describe("Login behavior", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockRecaptchaEnabled = true;
        mockExecuteRecaptcha.mockResolvedValue("captcha-token");
    });

    it("reports missing recaptcha and validation failures", async () => {
        const error = jest.spyOn(console, "error").mockImplementation(() => undefined);
        mockRecaptchaEnabled = false;
        render(<Login/>);
        fireEvent.click(screen.getByTestId("form-submit"));
        fireEvent.click(screen.getByTestId("invalid-submit"));
        await waitFor(() => expect(error).toHaveBeenCalledWith("Did not executeRecaptcha"));
        expect(error).toHaveBeenCalledWith("Did not executeRecaptcha");
        expect(error).toHaveBeenCalledWith("Failed:", {errorFields: [{errors: ["required"]}]});
    });

    it("logs in with a recaptcha token and navigates on success", async () => {
        mockLoginUser.mockResolvedValue({status: "SUCCESS"});
        render(<Login/>);
        fireEvent.click(screen.getByTestId("form-submit"));
        await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/"));
        expect(mockLoginUser).toHaveBeenCalledWith({
            username: "user@example.com", password: "secret", recaptchaToken: "captcha-token"
        });
        expect(mockNavigate).toHaveBeenCalledWith("/");
    });

    it("shows a failure alert and supports back and forgot-password navigation", async () => {
        mockLoginUser.mockResolvedValue({status: "FAILURE"});
        render(<Login/>);
        fireEvent.click(screen.getByText("Login.form.button.forgotPassword"));
        expect(mockNavigate).toHaveBeenCalledWith("/auth/lost-password");
        fireEvent.click(screen.getByTestId("form-submit"));
        expect(await screen.findByRole("alert")).toHaveTextContent("Login.updateStatus.loginFail");
        fireEvent.click(screen.getByText("common.button.back"));
        expect(mockNavigate).toHaveBeenCalledWith("/");
    });
});
