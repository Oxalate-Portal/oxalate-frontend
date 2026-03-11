import {createContext} from "react";
import type {LoginRequest, LoginStatus, PortalConfigGroupEnum, PortalConfigurationResponse, UserSessionToken} from "../models";

export interface SessionContextType {
    userSession: UserSessionToken | null;
    sessionLanguage: string;
    organizationName: string;
    portalTimezone: string;
    getSessionLanguage: () => string;
    setSessionLanguage: (language: string) => void;
    getPortalTimezone: () => string;
    getFrontendConfigurationValue: (key: string) => string;
    getPortalConfigurationValue: (groupKey: PortalConfigGroupEnum, settingKey: string) => string;
    getPortalConfiguration: () => PortalConfigurationResponse[];
    loginUser: (loginRequest: LoginRequest) => Promise<LoginStatus>;
    logoutUser: () => void;
    refreshUserSession: (sessionVO: UserSessionToken) => void;
}

export const SessionContext = createContext<SessionContextType | undefined>(undefined);
