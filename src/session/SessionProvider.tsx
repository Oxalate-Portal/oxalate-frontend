// Create a context to hold the session information
import { createContext, useContext, useEffect, useState } from "react";
import SessionVO from "../models/SessionVO";
import LoginRequest from "../models/requests/LoginRequest";
import authAPI from "../services/AuthAPI";

// Define the type for the session context
interface SessionContextType {
    userSession: SessionVO | null;
    loginUser: (loginRequest: LoginRequest) => void;
    logoutUser: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

function SessionProvider({children}: any) {
    const [user, setUser] = useState<SessionVO | null>(null);
    const userKey: string = "user";

    // Check if user data exists in local storage on initial load
    useEffect(() => {
        const userData = localStorage.getItem(userKey);
        console.log("Checking for user data in local storage:", userData);

        if (userData) {
            setUser(JSON.parse(userData));
        }
    }, [userKey]);

    // Function to handle login
    const loginUser = (loginRequest: LoginRequest) => {
        authAPI.login(loginRequest).then((response) => {
            console.log(response);
            setUser(response);
        }).catch((error) => {
            console.log(error);
        });
    };

    // Function to handle logout
    const logoutUser = () => {
        setUser(null);
        console.log("Logging out so set user data to null and calling authService.logout()");
        authAPI.logout();
    };

    const contextValue: SessionContextType = {
        userSession: user,
        loginUser,
        logoutUser
    };

    return (
            <SessionContext.Provider value={contextValue}>
                {children}
            </SessionContext.Provider>
    );
}

// Custom hook to use session data in components
function useSession(): SessionContextType {
    const context = useContext(SessionContext);
    if (!context) {
        throw new Error("useSession must be used within a SessionProvider");
    }

    return context;
}

export { SessionProvider, useSession };