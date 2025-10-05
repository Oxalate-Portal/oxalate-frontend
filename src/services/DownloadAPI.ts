import Axios, {type AxiosInstance} from "axios";
import type {DownloadCertificateResponse, DownloadDiveResponse, DownloadPaymentResponse} from "../models";

class DownloadAPI {
    protected axiosInstance: AxiosInstance;


    constructor(member: string) {
        this.axiosInstance = Axios.create({
            baseURL: `${import.meta.env.VITE_APP_API_URL}` + member,
            withCredentials: true,
            headers: {"Content-Type": "application/json;charset=utf-8"}
        });
    }

    public async downloadCertificates(): Promise<DownloadCertificateResponse[]> {
        const response = await this.axiosInstance.get<DownloadCertificateResponse[]>("/certificates");
        return response.data;
    }

    public async downloadDives(): Promise<DownloadDiveResponse[]> {
        const response = await this.axiosInstance.get<DownloadDiveResponse[]>("/dives");
        return response.data;
    }

    public async downloadPayments(): Promise<DownloadPaymentResponse[]> {
        const response = await this.axiosInstance.get<DownloadPaymentResponse[]>("/payments");
        return response.data;
    }
}

export const downloadAPI = new DownloadAPI("/data-download");