import {createContext, useContext, useEffect, useState} from "react";
import {ActionResultEnum, LoginStatus, PortalConfigGroupEnum, SessionVO} from "../models";
import {LoginRequest} from "../models/requests";
import {authAPI, portalConfigurationAPI} from "../services";
import {FrontendConfigurationResponse, PortalConfigurationResponse} from "../models/responses";

// Define the type for the session context
interface SessionContextType {
    userSession: SessionVO | null;
    sessionLanguage: string;
    organizationName: string;
    portalTimezone: string;
    getSessionLanguage: () => string;
    setSessionLanguage: (language: string) => void;
    getPortalTimezone: () => string;
    getFrontendConfigurationValue: (key: string) => string;
    getPortalConfigurationValue: (groupKey: PortalConfigGroupEnum, settingKey: string) => string;
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
    const [portalConfiguration, setPortalConfiguration] = useState<PortalConfigurationResponse[]>([]);

    const userKey: string = "user";
    const languageKey: string = "language";

    // Check if user data exists in local storage on initial load
    useEffect(() => {
        const loadPortalConfigurations = async () => {
            const configFetchStatus = await fetchPortalConfigurations();
            if (configFetchStatus === ActionResultEnum.FAILURE) {
                console.warn("Failed to fetch portal configurations during initialization");
            }
        };

        setLoading(true);
        const userData = localStorage.getItem(userKey);

        if (userData) {
            setUser(JSON.parse(userData));
            // We also reload the portal configurations if the user is already logged in
            loadPortalConfigurations();
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

    }, [userKey, languageKey, organizationName, portalTimezone]);

// Function to fetch portal configurations
    const fetchPortalConfigurations = async (): Promise<ActionResultEnum> => {
        try {
            const configurations: PortalConfigurationResponse[] = await portalConfigurationAPI.findAllPortalConfigurations();
            setPortalConfiguration(configurations);
            return ActionResultEnum.SUCCESS;
        } catch (error) {
            console.error("Failed to load portal configurations", error);
            return ActionResultEnum.FAILURE;
        }
    };

// Function to handle user login
    const loginUser = async (loginRequest: LoginRequest): Promise<LoginStatus> => {
        try {
            const sessionVO = await authAPI.login(loginRequest);
            localStorage.setItem(userKey, JSON.stringify(sessionVO));

            setUser(sessionVO);
            setLanguage(sessionVO.language);

            // Fetch portal configurations
            const configFetchStatus = await fetchPortalConfigurations();

            if (configFetchStatus === ActionResultEnum.SUCCESS) {
                return {
                    status: ActionResultEnum.SUCCESS,
                    message: "Login successful",
                };
            } else {
                return {
                    status: ActionResultEnum.FAILURE,
                    message: "Login successful, but failed to load portal configurations",
                };
            }
        } catch (error) {
            console.error("Failed to log in user", error);
            return {
                status: ActionResultEnum.FAILURE,
                message: "Failed to log in user",
            };
        }
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

    const getFrontendConfigurationValue = (key: string): string => {
        return getPortalConfigurationValue(PortalConfigGroupEnum.FRONTEND, key);
    }

    const getPortalConfigurationValue = (groupKey: PortalConfigGroupEnum, settingKey: string): string => {
        console.log("Searching for groupKey: " + groupKey + " and settingKey: " + settingKey);

        const config = portalConfiguration.find((config) => {
            return config.groupKey === groupKey.valueOf() && config.settingKey === settingKey;
        });

        console.log("Found config: ", config);

        if (config === undefined) {
            console.log("Returning empty string as config was not found");
            return "";
        }

        if (config.runtimeValue === null) {
            if (config.valueType === "enum") {
                const enumFirstValue = config.defaultValue.split(",")[0];
                console.log("Returning default enum value: ", enumFirstValue);
                return enumFirstValue;
            }

            console.log("Returning default value: ", config.defaultValue);
            return config.defaultValue;
        }

        console.log("Returning runtime value: ", config.runtimeValue);
        return config.runtimeValue;
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
        getFrontendConfigurationValue,
        getPortalConfigurationValue,
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
