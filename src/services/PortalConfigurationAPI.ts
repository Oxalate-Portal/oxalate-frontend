import Axios, {AxiosInstance} from "axios";
import {FrontendConfigurationResponse, PortalConfigurationResponse} from "../models/responses";
import {PortalConfigurationRequest} from "../models/requests";

class PortalConfigurationAPI {
    private axiosInstance: AxiosInstance;
    private baseUrl: string = `${import.meta.env.VITE_APP_API_URL}` + "/configurations";

    constructor() {
        this.axiosInstance = Axios.create({
            baseURL: this.baseUrl,
            withCredentials: true,
            headers: {"Content-Type": "application/json;charset=utf-8"
            }});
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
