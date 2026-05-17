import Axios, {type AxiosInstance} from "axios";
import type {DownloadCertificateResponse, DownloadDiveResponse, DownloadPaymentResponse} from "../models";
import {configureAxiosBaseUrl} from "./configureAxiosBaseUrl";

class DownloadAPI {
    protected axiosInstance: AxiosInstance;


    constructor(member: string) {
        this.axiosInstance = Axios.create({
            withCredentials: true,
            headers: {"Content-Type": "application/json;charset=utf-8"}
        });
        configureAxiosBaseUrl(this.axiosInstance, member);
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