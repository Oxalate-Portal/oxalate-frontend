// Create a context to hold the session information
import { createContext, useContext, useEffect, useState } from "react";
import SessionVO from "../models/SessionVO";
import LoginRequest from "../models/requests/LoginRequest";
import authAPI from "../services/AuthAPI";

// Define the type for the session context
interface SessionContextType {
    userSession: SessionVO | null;
    sessionLanguage: string;
    getSessionLanguage: () => string;
    setSessionLanguage: (language: string) => void;
    loginUser: (loginRequest: LoginRequest) => void;
    logoutUser: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

function SessionProvider({children}: any) {
    const [user, setUser] = useState<SessionVO | null>(null);
    const [language, setLanguage] = useState<string>("fi");
    const userKey: string = "user";
    const languageKey: string = "language";

    // Check if user data exists in local storage on initial load
    useEffect(() => {
        const userData = localStorage.getItem(userKey);
        console.log("Checking for user data in local storage:", userData);

        if (userData) {
            setUser(JSON.parse(userData));
        }

        const languageData = localStorage.getItem(languageKey);
        console.log("Checking for language data in local storage:", languageData);
        if (languageData) {
            console.log("Setting language to:", languageData);
            setLanguage(languageData);
        }
    }, [userKey, languageKey]);

    // Function to handle login
    const loginUser = (loginRequest: LoginRequest) => {
        authAPI.login(loginRequest).then((response) => {
            console.log(response);
            setUser(response);
            setLanguage(response.language);
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

    const setSessionLanguage = (language: string) => {
        console.log("Setting language to:", language);
        setLanguage(language);
        localStorage.setItem(languageKey, language);
    }

    const getSessionLanguage = () => {
        return language;
    }

    const contextValue: SessionContextType = {
        userSession: user,
        sessionLanguage: language,
        getSessionLanguage,
        setSessionLanguage,
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

    console.log("useSession() returning context:", context);

    return context;
}

export { SessionProvider, useSession };