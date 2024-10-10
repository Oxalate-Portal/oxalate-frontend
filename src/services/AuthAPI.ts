import Axios, {AxiosInstance} from "axios";
import {LoginRequest, LostPasswordRequest, PasswordResetRequest} from "../models/requests";
import {RegistrationVO, SessionVO, UpdateStatusVO} from "../models";
import {GenericMessageResponse, RegistrationResponse} from "../models/responses";

class AuthAPI {
    userKey: string = "user";

    protected axiosInstance: AxiosInstance;

    constructor(member: string) {
        this.axiosInstance = Axios.create({
            baseURL: `${import.meta.env.VITE_APP_API_URL}` + member
        });
    }

    async login(user: LoginRequest): Promise<SessionVO> {
        const response = await this.axiosInstance
            .post<SessionVO>("/login", user, {headers: {'X-Captcha-Token': user.recaptchaToken}});

        if (response.status === 200 && response.data.id > 0) {
            const session: SessionVO = response.data;
            localStorage.setItem(this.userKey, JSON.stringify(session));
        } else {
            if (response.status !== 200) {
                console.error("The response status was " + response.status + ": " + JSON.stringify(response));
            } else {
                console.error("The response did not contain data.token: " + JSON.stringify(response));
            }
        }
        return response.data;
    }

    async logout(): Promise<any> {
        return await this.axiosInstance.get<void>("/logout");
    }

    async register(registrationData: RegistrationVO): Promise<RegistrationResponse> {
        const response = await this.axiosInstance.post<RegistrationResponse>("/register", registrationData);
        return response.data;
    }

    async resendRegistrationEmail(token: string): Promise<boolean> {
        const response = await this.axiosInstance.post<void>("/registrations/resend-confirmation", {token: token});
        return response.status === 200;
    }

    async recoverLostPassword(data: LostPasswordRequest): Promise<GenericMessageResponse> {
        const response = await this.axiosInstance.post<GenericMessageResponse>("/lost-password", data);
        return response.data;
    }

    async resetPassword(data: PasswordResetRequest): Promise<GenericMessageResponse> {
        const response = await this.axiosInstance.post<GenericMessageResponse>("/reset-password", data);
        return response.data;
    }

    public async updatePassword(userId: number | undefined, postData: { oldPassword: any; newPassword: any; confirmPassword: any }): Promise<UpdateStatusVO> {
        this.setAuthorizationHeader();
        const response = await this.axiosInstance.put<UpdateStatusVO>("/" + userId + "/password", postData);
        return response.data;
    }

    /**
     * Sets the authorization header for the axios instance. We get the authorization bearer value from the local storage. We're forced
     * to do this on every request because the token can expire at any time.
     * This is a copy from the one in AbstractAPI.ts
     * @protected
     */
    protected setAuthorizationHeader(): void {
        const session: SessionVO = JSON.parse(localStorage.getItem("user") || "{}");

        if (session && session.accessToken) {
            this.axiosInstance.defaults.headers.common['Authorization'] = 'Bearer ' + session.accessToken;
        }
    }
}

export const authAPI = new AuthAPI('/auth');
