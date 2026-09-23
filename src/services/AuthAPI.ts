import Axios, {type AxiosInstance} from "axios";
import type {
    ActionResponse,
    EmailChangeRequest,
    LoginRequest,
    LostPasswordRequest,
    PasswordResetRequest,
    RegistrationResponse,
    RegistrationVO,
    UserSessionToken
} from "../models";
import {configureAxiosBaseUrl} from "./configureAxiosBaseUrl";

class AuthAPI {
    userKey: string = "user";

    protected axiosInstance: AxiosInstance;

    constructor(member: string) {
        this.axiosInstance = Axios.create({
            withCredentials: true
        });
        configureAxiosBaseUrl(this.axiosInstance, member);
    }

    async login(user: LoginRequest): Promise<UserSessionToken> {
        const response = await this.axiosInstance
            .post<UserSessionToken>("/login", user, this.captchaConfig(user.recaptcha_token));

        if (response.status === 200 && response.data.id > 0) {
            const session: UserSessionToken = response.data;
            localStorage.setItem(this.userKey, JSON.stringify(session));
        } else {
            // OWASP A09:2025 - never log the response body, it carries the user id, roles and other PII into
            // the browser console and into any console-capturing telemetry.
            console.error("Login did not produce a usable session, status: " + response.status);
        }
        return response.data;
    }

    async logout(): Promise<void> {
        await this.axiosInstance.get<void>("/logout");
    }

    /**
     * Registers a new user. The backend captcha filter rejects the request without a reCAPTCHA token, so the
     * caller obtains one with `executeRecaptcha("register")` first.
     */
    async register(registrationData: RegistrationVO, recaptchaToken: string | null): Promise<RegistrationResponse> {
        const response = await this.axiosInstance.post<RegistrationResponse>("/register", registrationData, this.captchaConfig(recaptchaToken));
        return response.data;
    }

    async requestEmailChange(requestData: EmailChangeRequest): Promise<boolean> {
        const response = await this.axiosInstance.post<boolean>("/email-change/requests", requestData);
        return response.data === true;
    }

    async resendRegistrationEmail(token: string, recaptchaToken: string | null): Promise<boolean> {
        const response = await this.axiosInstance.post<void>("/registrations/resend-confirmation", {token: token}, this.captchaConfig(recaptchaToken));
        return response.status === 200;
    }

    async recoverLostPassword(data: LostPasswordRequest, recaptchaToken: string | null): Promise<ActionResponse> {
        const response = await this.axiosInstance.post<ActionResponse>("/lost-password", data, this.captchaConfig(recaptchaToken));
        return response.data;
    }

    async resetPassword(data: PasswordResetRequest, recaptchaToken: string | null): Promise<ActionResponse> {
        const response = await this.axiosInstance.post<ActionResponse>("/reset-password", data, this.captchaConfig(recaptchaToken));
        return response.data;
    }

    public async updatePassword(
        userId: number | undefined,
        postData: { old_password: string; new_password: string; confirm_password: string }
    ): Promise<ActionResponse> {
        const response = await this.axiosInstance.put<ActionResponse>("/" + userId + "/password", postData);
        return response.data;
    }

    /** Request config carrying the reCAPTCHA v3 token the backend `RecaptchaFilter` requires on unauthenticated POSTs. */
    private captchaConfig(recaptchaToken: string | null): { headers: { "X-Captcha-Token": string } } {
        return {headers: {"X-Captcha-Token": recaptchaToken ?? ""}};
    }
}

export const authAPI = new AuthAPI("/auth");
