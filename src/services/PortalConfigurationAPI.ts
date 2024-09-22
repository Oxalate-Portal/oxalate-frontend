import Axios, {AxiosInstance} from "axios";
import {SessionVO} from "../models";
import {FrontendConfigurationResponse, PortalConfigurationResponse} from "../models/responses";
import {PortalConfigurationRequest} from "../models/requests";

class PortalConfigurationAPI {
    private axiosInstance: AxiosInstance;
    private baseUrl: string = `${import.meta.env.VITE_APP_API_URL}` + "/configurations";

    constructor() {
        this.axiosInstance = Axios.create({baseURL: this.baseUrl});
        this.axiosInstance.defaults.headers.put["Content-Type"] = "application/json;charset=utf-8";
    }

    public async findAllPortalConfigurations(): Promise<PortalConfigurationResponse[]> {
        this.setAuthorizationHeader();
        const response = await this.axiosInstance.get<PortalConfigurationResponse[]>("");
        return response.data;
    }

    public async updateConfigurationValue(request: PortalConfigurationRequest): Promise<PortalConfigurationResponse> {
        this.setAuthorizationHeader();
        const response = await this.axiosInstance.put<PortalConfigurationResponse>("", request);
        return response.data;
    }

    public async getFrontendConfiguration(): Promise<FrontendConfigurationResponse[]> {
        this.setAuthorizationHeader();
        const response = await this.axiosInstance.get<FrontendConfigurationResponse[]>("/frontend");
        return response.data;
    }

    public async reloadPortalConfiguration(): Promise<PortalConfigurationResponse[]> {
        this.setAuthorizationHeader();
        const response = await this.axiosInstance.get<PortalConfigurationResponse[]>("/reload");
        return response.data;
    }

    /**
     * Sets the authorization header for the axios instance. We get the authorization bearer value from the local storage. We're forced
     * to do this on every request because the token can expire at any time.
     * @private
     */
    private setAuthorizationHeader(): void {
        const session: SessionVO = JSON.parse(localStorage.getItem("user") || "{}");

        if (session && session.accessToken) {
            this.axiosInstance.defaults.headers.common["Authorization"] = "Bearer " + session.accessToken;
        }
    }
}

export const portalConfigurationAPI = new PortalConfigurationAPI();
