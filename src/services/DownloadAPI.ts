import Axios, {AxiosInstance} from "axios";
import {SessionVO} from "../models";
import {DownloadCertificateResponse, DownloadDiveResponse, DownloadPaymentResponse} from "../models/responses/downloads";

class DownloadAPI {
    protected axiosInstance: AxiosInstance;


    constructor() {
        this.axiosInstance = Axios.create({baseURL: `${import.meta.env.VITE_APP_API_URL}`});
        this.axiosInstance.defaults.headers.put['Content-Type'] = 'application/json;charset=utf-8';

    }

    public async downloadCertificates(): Promise<DownloadCertificateResponse[]> {
        this.setAuthorizationHeader();
        const response = await this.axiosInstance.get<DownloadCertificateResponse[]>("/data-download/certificates");
        return response.data;
    }

    public async downloadDives(): Promise<DownloadDiveResponse[]> {
        this.setAuthorizationHeader();
        const response = await this.axiosInstance.get<DownloadDiveResponse[]>("/data-download/dives");
        return response.data;
    }

    public async downloadPayments(): Promise<DownloadPaymentResponse[]> {
        this.setAuthorizationHeader();
        const response = await this.axiosInstance.get<DownloadPaymentResponse[]>("/data-download/payments");
        return response.data;
    }

    /**
     * Sets the authorization header for the axios instance. We get the authorization bearer value from the local storage. We're forced
     * to do this on every request because the token can expire at any time.
     * @protected
     */
    protected setAuthorizationHeader(): void {
        const session: SessionVO = JSON.parse(localStorage.getItem("user") || "{}");

        if (session && session.accessToken) {
            this.axiosInstance.defaults.headers.common['Authorization'] = 'Bearer ' + session.accessToken;
        }
    }
}

export const downloadAPI = new DownloadAPI();