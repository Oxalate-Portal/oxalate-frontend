import {createContext, useContext, useEffect, useState} from "react";
import {ActionResultEnum, LoginStatus, SessionVO} from "../models";
import {LoginRequest} from "../models/requests";
import {authAPI, portalConfigurationAPI} from "../services";
import {FrontendConfigurationResponse} from "../models/responses";

// Define the type for the session context
interface SessionContextType {
    userSession: SessionVO | null;
    sessionLanguage: string;
    organizationName: string;
    portalTimezone: string;
    getSessionLanguage: () => string;
    setSessionLanguage: (language: string) => void;
    getPortalTimezone: () => string;
    loginUser: (loginRequest: LoginRequest) => Promise<LoginStatus>;
    logoutUser: () => void;
    refreshUserSession: (sessionVO: SessionVO) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({children}: any) {
    const [user, setUser] = useState<SessionVO | null>(null);
    const [language, setLanguage] = useState<string>("en");
    const [organizationName, setOrganizationName] = useState<string>("");
    const [portalTimezone, setPortalTimezone] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true); // New state to track loading
    const [frontendConfiguration, setFrontendConfiguration] = useState<FrontendConfigurationResponse[]>([]);

    const userKey: string = "user";
    const languageKey: string = "language";

    // Check if user data exists in local storage on initial load
    useEffect(() => {
        setLoading(true);
        const userData = localStorage.getItem(userKey);

        if (userData) {
            setUser(JSON.parse(userData));
        }

        portalConfigurationAPI.getFrontendConfiguration()
                .then((configurations: FrontendConfigurationResponse[]) => {
                    setFrontendConfiguration(configurations);
                    const languageData = localStorage.getItem(languageKey);

                    if (languageData) {
                        setLanguage(languageData);
                    } else {
                        const languageConfig = configurations.find((config) => config.key === "default-language");

                        if (languageConfig) {
                            setLanguage(languageConfig.value);
                            localStorage.setItem(languageKey, languageConfig.value);
                        }
                    }

                    if (organizationName === "") {
                        setOrganizationName(configurations.find((config) => config.key === "org-name")?.value || "Oxalate Portal");
                    }

                    if (portalTimezone === "") {
                        setPortalTimezone(configurations.find((config) => config.key === "timezone")?.value || "UTC");
                    }
                })
                .finally(() => {
                    setLoading(false);
                });

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

    const getPortalTimezone = () => {
        return portalTimezone;
    }

    const refreshUserSession = (sessionVO: SessionVO): void => {
        localStorage.setItem(userKey, JSON.stringify(sessionVO));
        setUser(sessionVO);
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    const contextValue: SessionContextType = {
        userSession: user,
        sessionLanguage: language,
        organizationName: organizationName,
        portalTimezone: portalTimezone,
        getSessionLanguage,
        setSessionLanguage,
        getPortalTimezone,
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
