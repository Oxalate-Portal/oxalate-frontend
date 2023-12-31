import {useLocation} from "react-router-dom";
import {useEffect} from "react";
import SessionVO from "../models/SessionVO";

interface AuthVerifyProps {
    logOut: () => void
}

function AuthVerify({logOut}: AuthVerifyProps) {
    const location = useLocation();

    useEffect(() => {
        const session: SessionVO = JSON.parse(localStorage.getItem("user") || "{}");
        console.debug("Verifying session timeout:", session);

        if (session !== null && session.expiresAt) {
            const now = new Date();
            const sessionExpiry = new Date(session.expiresAt);
            console.debug("Session expires in: " + (sessionExpiry.getTime() - now.getTime()) + "ms");
            if (sessionExpiry.getTime() < now.getTime()) {
                logOut();
            }
        } else {
            console.debug("Session is null or does not have an expiry date", session);
        }
    }, [location, logOut]);

    return (<></>);
}

export default AuthVerify;