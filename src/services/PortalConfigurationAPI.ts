import Axios, {type AxiosInstance} from "axios";
import type {FrontendConfigurationResponse, PortalConfigurationRequest, PortalConfigurationResponse} from "../models";
import {configureAxiosBaseUrl} from "./configureAxiosBaseUrl";

class PortalConfigurationAPI {
    private axiosInstance: AxiosInstance;

    constructor() {
        this.axiosInstance = Axios.create({
            withCredentials: true,
            headers: {"Content-Type": "application/json;charset=utf-8"
            }});
        configureAxiosBaseUrl(this.axiosInstance, "/configurations");
    }

    public async findAllPortalConfigurations(): Promise<PortalConfigurationResponse[]> {
        const response = await this.axiosInstance.get<PortalConfigurationResponse[]>("");
        return response.data;
    }

    public async updateConfigurationValue(request: PortalConfigurationRequest): Promise<PortalConfigurationResponse> {
        const response = await this.axiosInstance.put<PortalConfigurationResponse>("", request);
        return response.data;
    }

    public async getFrontendConfiguration(): Promise<FrontendConfigurationResponse[]> {
        const response = await this.axiosInstance.get<FrontendConfigurationResponse[]>("/frontend");
        return response.data;
    }

    public async reloadPortalConfiguration(): Promise<PortalConfigurationResponse[]> {
        const response = await this.axiosInstance.get<PortalConfigurationResponse[]>("/reload");
        return response.data;
    }
}

export const portalConfigurationAPI = new PortalConfigurationAPI();
