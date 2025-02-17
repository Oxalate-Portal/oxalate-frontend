import Axios, {AxiosInstance} from "axios";
import {DownloadCertificateResponse, DownloadDiveResponse, DownloadPaymentResponse} from "../models/responses/downloads";

class DownloadAPI {
    protected axiosInstance: AxiosInstance;


    constructor() {
        this.axiosInstance = Axios.create({
            baseURL: `${import.meta.env.VITE_APP_API_URL}`,
            withCredentials: true,
            headers: {"Content-Type": "application/json;charset=utf-8"}
        });
    }

    public async downloadCertificates(): Promise<DownloadCertificateResponse[]> {
        const response = await this.axiosInstance.get<DownloadCertificateResponse[]>("/data-download/certificates");
        return response.data;
    }

    public async downloadDives(): Promise<DownloadDiveResponse[]> {
        const response = await this.axiosInstance.get<DownloadDiveResponse[]>("/data-download/dives");
        return response.data;
    }

    public async downloadPayments(): Promise<DownloadPaymentResponse[]> {
        const response = await this.axiosInstance.get<DownloadPaymentResponse[]>("/data-download/payments");
        return response.data;
    }
}

export const downloadAPI = new DownloadAPI();