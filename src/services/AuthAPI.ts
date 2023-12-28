import LoginRequest from "../models/requests/LoginRequest";
import axios from "axios";
import SessionVO from "../models/SessionVO";

const API_URL = `${process.env.REACT_APP_API_URL}/auth/login`;

class AuthAPI {
    userKey: string = "user";

    async login(user: LoginRequest) {
        const response = await axios
            .post<SessionVO>(API_URL, user, {headers: {'X-Captcha-Token': user.recaptchaToken}});

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
}

const authAPI = new AuthAPI();
export default authAPI;
