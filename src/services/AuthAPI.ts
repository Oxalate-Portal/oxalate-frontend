import LoginRequest from "../models/requests/LoginRequest";
import axios from "axios";
import SessionVO from "../models/SessionVO";

const API_URL = `${process.env.REACT_APP_API_URL}/login`;

class AuthAPI {
    userKey: string = "user";

    async login(user: LoginRequest) {
        const response = await axios
            .post(API_URL, user);

        if (response.status === 200 && response.data.id > 0) {
            console.info("Storing login response to local storage: ");

            const session: SessionVO = {
                id: response.data.id,
                username: response.data.username,
                firstName: response.data.firstName,
                lastName: response.data.lastName,
                phoneNumber: response.data.phoneNumber,
                registered: response.data.registered,
                diveCount: response.data.diveCount,
                payments: response.data.payments,
                approvedTerms: response.data.approvedTerms,
                language: response.data.language,
                accessToken: response.data.token,
                type: response.data.type,
                roles: response.data.roles,
                status: response.data.status,
                expiresAt: response.data.expiresAt,
            };

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
        console.log("Logout so clearing out local storage");
        localStorage.removeItem(this.userKey);
        console.info("Removed user key from local storage");
    }
}

const authAPI = new AuthAPI();
export default authAPI;
