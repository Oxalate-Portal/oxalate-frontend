import SessionVO from "../models/SessionVO";

export default function authHeader() {
    const session: SessionVO = JSON.parse(localStorage.getItem("user") || "{}");

    if (session && session.accessToken) {
        return {Authorization: "Bearer " + session.accessToken};
    } else {
        return {};
    }
}