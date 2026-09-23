import MockAdapter from "axios-mock-adapter";
import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import {MemoryRouter} from "react-router-dom";
import {authAPI} from "../services";
import {LostPassword, ResendRegistrationEmail} from "../components";
import {UpdateStatusEnum} from "../models";

jest.mock("../session", () => ({useSession: () => ({userSession: null})}));

/**
 * OWASP A07:2025 - the backend RecaptchaFilter rejects every unauthenticated auth POST that carries no
 * X-Captcha-Token header. Every protected flow must therefore obtain a reCAPTCHA token and send it; the
 * registration page once rendered without the provider and registrations failed with "No reCaptcha token found".
 */
describe("security: reCAPTCHA token on captcha protected auth endpoints", () => {
    // Access the axios instance of the singleton the same way the other service tests do.
    const axiosInstance = (authAPI as unknown as { axiosInstance: import("axios").AxiosInstance }).axiosInstance;
    let mock: MockAdapter;

    beforeEach(() => {
        mock = new MockAdapter(axiosInstance);
    });

    afterEach(() => {
        mock.restore();
    });

    const captchaHeaderOf = (path: string) => mock.history.post.find((request) => request.url === path)?.headers?.["X-Captcha-Token"];

    it("sends the token on register, resend-confirmation, lost-password and reset-password", async () => {
        mock.onPost("/register").reply(200, {status: "OK", token: "t"});
        mock.onPost("/registrations/resend-confirmation").reply(200);
        mock.onPost("/lost-password").reply(200, {status: UpdateStatusEnum.OK, message: ""});
        mock.onPost("/reset-password").reply(200, {status: UpdateStatusEnum.OK, message: ""});

        await authAPI.register({
            username: "u@example.com", password: "p", first_name: "f", last_name: "l", phone_number: "1", next_of_kin: "n",
            privacy: false, language: "en", primary_user_type: "SCUBA_DIVER", approved_terms: true, health_statement_id: 0
        } as never, "register-token");
        await authAPI.resendRegistrationEmail("registration-token", "resend-token");
        await authAPI.recoverLostPassword({email: "u@example.com"}, "lost-token");
        await authAPI.resetPassword({new_password: "a", confirm_password: "a", token: "x"}, "reset-token");

        expect(captchaHeaderOf("/register")).toBe("register-token");
        expect(captchaHeaderOf("/registrations/resend-confirmation")).toBe("resend-token");
        expect(captchaHeaderOf("/lost-password")).toBe("lost-token");
        expect(captchaHeaderOf("/reset-password")).toBe("reset-token");
    });

    it("obtains a reCAPTCHA token before requesting a password reset link", async () => {
        mock.onPost("/lost-password").reply(200, {status: UpdateStatusEnum.OK, message: ""});

        render(<MemoryRouter><LostPassword/></MemoryRouter>);
        fireEvent.change(screen.getByRole("textbox"), {target: {value: "user@example.com"}});
        fireEvent.click(screen.getByRole("button", {name: /LostPassword\.form\./}));

        await waitFor(() => expect(mock.history.post).toHaveLength(1));
        expect(captchaHeaderOf("/lost-password")).toBe("mock-recaptcha-token");
    });

    it("obtains a reCAPTCHA token before resending the confirmation email", async () => {
        mock.onPost("/registrations/resend-confirmation").reply(200);

        render(<ResendRegistrationEmail token={"registration-token"}/>);
        fireEvent.click(screen.getByRole("button", {name: "common.button.send"}));

        await waitFor(() => expect(mock.history.post).toHaveLength(1));
        expect(captchaHeaderOf("/registrations/resend-confirmation")).toBe("mock-recaptcha-token");
        expect(JSON.parse(String(mock.history.post[0].data))).toEqual({token: "registration-token"});
    });
});
