import {useLocation} from "react-router-dom";
import {useEffect} from "react";
import type {UserSessionToken} from "../models";

interface AuthVerifyProps {
    logOut: () => void;
}

export function AuthVerify({logOut}: AuthVerifyProps) {
    const location = useLocation();

    useEffect(() => {
        const session: UserSessionToken = JSON.parse(localStorage.getItem("user") || "{}");

        if (session !== null && session.expires_at) {
            const now = new Date();
            const sessionExpiry = new Date(session.expires_at);

            if (sessionExpiry.getTime() < now.getTime()) {
                logOut();
            }
        }
    }, [location, logOut]);

    return (<></>);
}
