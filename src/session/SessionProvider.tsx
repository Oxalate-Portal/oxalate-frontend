import {createContext, useContext, useEffect, useState} from "react";
import {ActionResultEnum, LoginStatus, SessionVO} from "../models";
import {LoginRequest} from "../models/requests";
import {authAPI, portalConfigurationAPI} from "../services";

// Define the type for the session context
interface SessionContextType {
    userSession: SessionVO | null;
    sessionLanguage: string;
    organizationName: string;
    getSessionLanguage: () => string;
    setSessionLanguage: (language: string) => void;
    loginUser: (loginRequest: LoginRequest) => Promise<LoginStatus>;
    logoutUser: () => void;
    refreshUserSession: (sessionVO: SessionVO) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({children}: any) {
    const [user, setUser] = useState<SessionVO | null>(null);
    const [language, setLanguage] = useState<string>("en");
    const [organizationName, setOrganizationName] = useState<string>("Oxalate Portal");
    const [isLoading, setIsLoading] = useState<boolean>(true); // New state to track loading

    const userKey: string = "user";
    const languageKey: string = "language";

    // Check if user data exists in local storage on initial load
    useEffect(() => {
        setIsLoading(true);
        const userData = localStorage.getItem(userKey);

        if (userData) {
            setUser(JSON.parse(userData));
        }

        const languageData = localStorage.getItem(languageKey);

        if (languageData) {
            setLanguage(languageData);
        } else {
            portalConfigurationAPI.getFrontendConfiguration()
                    .then((configurations) => {
                        setOrganizationName(configurations.find((config) => config.key === "org-name")?.value || "Oxalate Portal");
                        const languageConfig = configurations.find((config) => config.key === "default-language");

                        if (languageConfig) {
                            setLanguage(languageConfig.value);
                        }
                    });
        }

        setIsLoading(false);
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
                    };
                })
                .catch((error) => {
                    console.error(error);
                    return {
                        status: ActionResultEnum.FAILURE,
                        message: "Failed to log on user"
                    };
                });
    };

    // Function to handle logout
    const logoutUser = () => {
        authAPI.logout()
                .then(() => {
                    console.debug("User logged out");
                })
                .catch((error) => {
                    console.error("Failed to log out user", error);
                })
                .finally(() => {
                    setUser(null);
                    localStorage.removeItem(userKey);
                    window.location.href = "/";
                });
    };

    const setSessionLanguage = (language: string) => {
        setLanguage(language);
        localStorage.setItem(languageKey, language);
    };

    const getSessionLanguage = () => {
        return language;
    };

    const refreshUserSession = (sessionVO: SessionVO): void => {
        localStorage.setItem(userKey, JSON.stringify(sessionVO));
        setUser(sessionVO);
    };

    if (isLoading) {
        return <div>Loading...</div>;
    }

    const contextValue: SessionContextType = {
        userSession: user,
        sessionLanguage: language,
        organizationName: organizationName,
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
export function useSession(): SessionContextType {
    const context = useContext(SessionContext);
    if (!context) {
        console.error("No context found");
        throw new Error("useSession must be used within a SessionProvider");
    }

    return context;
}
