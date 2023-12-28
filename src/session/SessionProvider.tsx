// Create a context to hold the session information
import {createContext, useContext, useEffect, useState} from "react";
import SessionVO from "../models/SessionVO";
import LoginRequest from "../models/requests/LoginRequest";
import authAPI from "../services/AuthAPI";
import ActionResultEnum from "../models/ActionResultEnum";
import LoginStatus from "../models/LoginStatus";

// Define the type for the session context
interface SessionContextType {
    userSession: SessionVO | null;
    sessionLanguage: string;
    getSessionLanguage: () => string;
    setSessionLanguage: (language: string) => void;
    loginUser: (loginRequest: LoginRequest) => Promise<LoginStatus>;
    logoutUser: () => void;
    refreshUserSession: (sessionVO: SessionVO) => void;
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
    const loginUser = async (loginRequest: LoginRequest): Promise<LoginStatus> => {
        return authAPI.login(loginRequest)
                .then((sessionVO) => {
                    localStorage.setItem(userKey, JSON.stringify(sessionVO));

                    setUser(sessionVO);
                    setLanguage(sessionVO.language);
                    return {
                        status: ActionResultEnum.SUCCESS,
                        message: "Login successful"
                    }
                })
                .catch((error) => {
                    console.log(error);
                    return {
                        status: ActionResultEnum.FAILURE,
                        message: "Failed to log on user"
                    }
                });
    };

    // Function to handle logout
    const logoutUser = () => {
        setUser(null);
        console.log("Logout so clearing out local storage");
        localStorage.removeItem(userKey);
        console.info("Removed user key from local storage");
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

    const refreshUserSession = (sessionVO: SessionVO): void => {
        localStorage.setItem(userKey, JSON.stringify(sessionVO));
        setUser(sessionVO);
    }

    const contextValue: SessionContextType = {
        userSession: user,
        sessionLanguage: language,
        getSessionLanguage,
        setSessionLanguage,
        loginUser,
        logoutUser,
        refreshUserSession
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

export {SessionProvider, useSession};