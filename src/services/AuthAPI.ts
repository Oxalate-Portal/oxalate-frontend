import Axios, {type AxiosInstance} from "axios";
import type {ActionResponse, LoginRequest, LostPasswordRequest, PasswordResetRequest, RegistrationResponse, RegistrationVO, UserSessionToken} from "../models";

class AuthAPI {
    userKey: string = "user";

    protected axiosInstance: AxiosInstance;

    constructor(member: string) {
        this.axiosInstance = Axios.create({
            baseURL: `${import.meta.env.VITE_APP_API_URL}` + member,
            withCredentials: true
        });
    }

    async login(user: LoginRequest): Promise<UserSessionToken> {
        const response = await this.axiosInstance
            .post<UserSessionToken>("/login", user, {headers: {'X-Captcha-Token': user.recaptchaToken}});

        if (response.status === 200 && response.data.id > 0) {
            const session: UserSessionToken = response.data;
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

    async recoverLostPassword(data: LostPasswordRequest): Promise<ActionResponse> {
        const response = await this.axiosInstance.post<ActionResponse>("/lost-password", data);
        return response.data;
    }

    async resetPassword(data: PasswordResetRequest): Promise<ActionResponse> {
        const response = await this.axiosInstance.post<ActionResponse>("/reset-password", data);
        return response.data;
    }

    public async updatePassword(userId: number | undefined, postData: { oldPassword: any; newPassword: any; confirmPassword: any }): Promise<ActionResponse> {
        const response = await this.axiosInstance.put<ActionResponse>("/" + userId + "/password", postData);
        return response.data;
    }
}

export const authAPI = new AuthAPI('/auth');
