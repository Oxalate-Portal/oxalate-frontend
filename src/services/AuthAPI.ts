import LoginRequest from "../models/requests/LoginRequest";
import axios from "axios";
import SessionVO from "../models/SessionVO";
import RegistrationVO from "../models/RegistrationVO";
import RegistrationResponse from "../models/responses/RegistrationResponse";
import LostPasswordRequest from "../models/requests/LostPasswordRequest";
import GenericMessageResponse from "../models/responses/GenericMessageResponse";
import PasswordResetRequest from "../models/requests/PasswordResetRequest";

class AuthAPI {
    userKey: string = "user";
    BASE_URL: string = process.env.REACT_APP_API_URL + '/auth' || "";

    async login(user: LoginRequest) {
        const response = await axios
            .post<SessionVO>(this.BASE_URL + "/login", user, {headers: {'X-Captcha-Token': user.recaptchaToken}});

        if (response.status === 200 && response.data.id > 0) {
            const session: SessionVO = response.data;
            console.info("Received session data:", session);
            localStorage.setItem(this.userKey, JSON.stringify(session));
            console.log('After login post, set user data in local storage:', session);
        } else {
            if (response.status !== 200) {
                console.info("The response status was " + response.status + ": " + JSON.stringify(response));
            } else {
                console.info("The response did not contain data.token: " + JSON.stringify(response));
            }
        }
        return response.data;
    }

    logout() {
        // We could add here call to backend to end session
    }

    async register(registrationData: RegistrationVO): Promise<RegistrationResponse> {
        const response = await axios.post<RegistrationResponse>(this.BASE_URL + "/register", registrationData);
        return response.data;
    }

    async resendRegistrationEmail(token: string): Promise<boolean> {
        const response = await axios.post<void>(this.BASE_URL + "/registrations/resend-confirmation", {token: token});
        return response.status === 200;
    }

    async recoverLostPassword(data: LostPasswordRequest): Promise<GenericMessageResponse> {
        const response = await axios.post<GenericMessageResponse>(this.BASE_URL + "/lost-password", data);
        return response.data;
    }

    async resetPassword(data: PasswordResetRequest): Promise<GenericMessageResponse> {
        const response = await axios.post<GenericMessageResponse>(this.BASE_URL + "/reset-password", data);
        return response.data;
    }
}

const authAPI = new AuthAPI();
export default authAPI;
